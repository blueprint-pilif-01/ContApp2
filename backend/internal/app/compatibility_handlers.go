package app

import (
	"backend/internal/models"
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type adminOrganisationUpdateRequest struct {
	Name    string  `json:"name"`
	CUI     *string `json:"cui"`
	Address *string `json:"address"`
	Status  string  `json:"status"`
}

func (a *App) updateAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input adminOrganisationUpdateRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if strings.TrimSpace(input.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	status := defaultString(strings.TrimSpace(input.Status), "active")
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE organisations
		SET name = $2, cui = $3, address = $4, status = $5, updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
	`, id, strings.TrimSpace(input.Name), input.CUI, input.Address, status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update organisation")
		return
	}
	organisation, err := a.Repo.GetOrganisationByID(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "organisation not found")
		return
	}
	httpx.JSON(w, http.StatusOK, organisation)
}

func (a *App) deleteAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE organisations
		SET status = 'deleted', deleted_at = now(), updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
	`, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete organisation")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Organisation deleted."})
}

func (a *App) adminOrganisationStatusAction(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	action := strings.TrimPrefix(r.URL.Path, fmt.Sprintf("%s/admin/organisations/%d/", a.Config.APIBasePath, id))
	status := "active"
	if action == "suspend" {
		status = "suspended"
	}
	if err := a.Repo.UpdateOrganisationStatus(r.Context(), id, status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update organisation status")
		return
	}
	organisation, err := a.Repo.GetOrganisationByID(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "organisation not found")
		return
	}
	httpx.JSON(w, http.StatusOK, organisation)
}

func (a *App) getAdminOrganisationExtensions(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	features, err := a.Repo.ListOrganisationFeatures(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation extensions")
		return
	}
	httpx.JSON(w, http.StatusOK, currentExtensionsResponse{
		Extensions: frontendExtensionsFromFeatures(features),
	})
}

type adminExtensionToggleRequest struct {
	Key     string `json:"key"`
	Enabled bool   `json:"enabled"`
}

func (a *App) updateAdminOrganisationExtensions(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input adminExtensionToggleRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || input.Key == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	featureKey := featureKeyFromExtension(input.Key)
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		WITH feature AS (
			INSERT INTO feature_definitions (feature_key, name, package_name, category, description)
			VALUES ($2, $3, $3, 'extension', 'Enabled from admin extension compatibility endpoint.')
			ON CONFLICT (feature_key)
			DO UPDATE SET updated_at = now()
			RETURNING id
		)
		INSERT INTO organisation_features (organisation_id, feature_definition_id, enabled, source)
		SELECT $1, id, $4, 'manual'
		FROM feature
		ON CONFLICT (organisation_id, feature_definition_id)
		DO UPDATE SET enabled = EXCLUDED.enabled, source = 'manual', updated_at = now()
	`, id, featureKey, extensionDisplayName(input.Key), input.Enabled); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update organisation extension")
		return
	}
	a.getAdminOrganisationExtensions(w, r)
}

func featureKeyFromExtension(key string) string {
	switch key {
	case "contracts_pro":
		return FeatureContracts
	case "ticketing_pro":
		return FeatureTicketing
	case "hr_pro":
		return "hr"
	default:
		return key
	}
}

func extensionDisplayName(key string) string {
	return strings.Title(strings.ReplaceAll(key, "_", " "))
}

type documentManagerItem struct {
	ID         int64      `json:"id"`
	Name       string     `json:"name"`
	Type       string     `json:"type"`
	MimeType   string     `json:"mime_type,omitempty"`
	Size       int64      `json:"size,omitempty"`
	ClientID   *int64     `json:"client_id,omitempty"`
	ClientName *string    `json:"client_name,omitempty"`
	Folder     string     `json:"folder"`
	UploadedBy *int64     `json:"uploaded_by,omitempty"`
	UploadedAt time.Time  `json:"uploaded_at"`
	DeletedAt  *time.Time `json:"-"`
}

func (a *App) listDocumentManagerItems(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			f.id,
			COALESCE(od.document_name, f.original_name) AS name,
			CASE WHEN f.mime_type = 'application/x-directory' THEN 'folder' ELSE 'file' END AS type,
			f.mime_type,
			f.size_bytes,
			CASE WHEN COALESCE(f.category, '') LIKE '/%' THEN f.category ELSE '/' END AS folder,
			f.uploaded_by_id,
			f.created_at,
			f.deleted_at
		FROM files f
		LEFT JOIN organisation_documents od
			ON od.file_id = f.id
			AND od.deleted_at IS NULL
		WHERE f.organisation_id = $1
			AND f.deleted_at IS NULL
		ORDER BY f.created_at DESC, f.id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list documents")
		return
	}
	defer rows.Close()

	items := make([]documentManagerItem, 0)
	for rows.Next() {
		var item documentManagerItem
		if err := rows.Scan(&item.ID, &item.Name, &item.Type, &item.MimeType, &item.Size, &item.Folder, &item.UploadedBy, &item.UploadedAt, &item.DeletedAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan documents")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"documents": items})
}

type documentUploadRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	MimeType string `json:"mime_type"`
	Size     int64  `json:"size"`
	Folder   string `json:"folder"`
}

func (a *App) uploadDocumentManagerItem(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input documentUploadRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Folder == "" || !strings.HasPrefix(input.Folder, "/") {
		input.Folder = "/"
	}
	if input.Type != "folder" && input.MimeType == "" {
		input.MimeType = "application/octet-stream"
	}
	if input.Type == "folder" {
		input.MimeType = "application/x-directory"
		input.Size = 0
	}

	category := input.Folder
	file := models.File{
		OrganisationID: claims.OrganisationID,
		UploadedByID:   &claims.MembershipID,
		StorageKey:     fmt.Sprintf("documents/%d/%d/%s", claims.OrganisationID, time.Now().UnixNano(), safeStorageName(input.Name)),
		OriginalName:   input.Name,
		MimeType:       input.MimeType,
		SizeBytes:      input.Size,
		Category:       &category,
	}
	if err := a.Repo.CreateFile(r.Context(), &file); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create document")
		return
	}
	if input.Type != "folder" {
		document := models.OrganisationDocument{
			OrganisationID: claims.OrganisationID,
			FileID:         file.ID,
			UploadedByID:   &claims.MembershipID,
			DocumentName:   input.Name,
			Visibility:     "organisation",
		}
		if err := a.Repo.CreateOrganisationDocument(r.Context(), &document); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create document metadata")
			return
		}
	}
	httpx.JSON(w, http.StatusCreated, documentManagerItem{
		ID:         file.ID,
		Name:       input.Name,
		Type:       input.Type,
		MimeType:   input.MimeType,
		Size:       input.Size,
		Folder:     input.Folder,
		UploadedBy: file.UploadedByID,
		UploadedAt: file.CreatedAt,
	})
}

func (a *App) deleteDocumentManagerItem(w http.ResponseWriter, r *http.Request) {
	a.deleteFile(w, r)
}

func safeStorageName(name string) string {
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	return name
}

type settingsUserResponse struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	Email   string  `json:"email"`
	Phone   *string `json:"phone,omitempty"`
	RoleID  *int64  `json:"role_id,omitempty"`
	RoleIDs []int64 `json:"role_ids"`
	Status  string  `json:"status"`
	Title   *string `json:"title,omitempty"`
}

type settingsUserRequest struct {
	Name     string  `json:"name"`
	Email    string  `json:"email"`
	Phone    *string `json:"phone"`
	Title    *string `json:"title"`
	RoleID   *int64  `json:"role_id"`
	RoleIDs  []int64 `json:"role_ids"`
	Status   string  `json:"status"`
	Password string  `json:"password"`
}

func (a *App) listSettingsUsers(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	members, err := a.Repo.ListWorkspaceMembers(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list users")
		return
	}
	users := make([]settingsUserResponse, 0, len(members))
	for _, member := range members {
		users = append(users, settingsUserFromMember(member))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"users": users})
}

func (a *App) getSettingsUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	member, err := a.Repo.GetWorkspaceMember(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "user not found")
		return
	}
	httpx.JSON(w, http.StatusOK, settingsUserFromMember(*member))
}

func (a *App) createSettingsUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input settingsUserRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	firstName, lastName := splitDisplayName(input.Name)
	password := input.Password
	if password == "" {
		password = "password"
	}
	memberInput := createMemberRequest{
		Email:     input.Email,
		Password:  password,
		FirstName: firstName,
		LastName:  lastName,
		Phone:     input.Phone,
		JobTitle:  input.Title,
		Status:    defaultString(input.Status, "active"),
	}
	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not hash password")
		return
	}
	member := models.WorkspaceMember{
		OrganisationID: claims.OrganisationID,
		Email:          memberInput.Email,
		FirstName:      memberInput.FirstName,
		LastName:       memberInput.LastName,
		Phone:          memberInput.Phone,
		JobTitle:       memberInput.JobTitle,
		Status:         memberInput.Status,
	}
	if err := a.Repo.CreateWorkspaceMember(r.Context(), &member, passwordHash); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create user")
		return
	}
	roleIDs := normalizedRoleIDs(input.RoleIDs, input.RoleID)
	if len(roleIDs) > 0 {
		if err := a.Repo.SetMembershipRoles(r.Context(), claims.OrganisationID, member.MembershipID, roleIDs); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not assign roles")
			return
		}
	}
	created, _ := a.Repo.GetWorkspaceMember(r.Context(), claims.OrganisationID, member.MembershipID)
	if created == nil {
		httpx.JSON(w, http.StatusCreated, settingsUserFromMember(member))
		return
	}
	httpx.JSON(w, http.StatusCreated, settingsUserFromMember(*created))
}

func (a *App) updateSettingsUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input settingsUserRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	existing, err := a.Repo.GetWorkspaceMember(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "user not found")
		return
	}
	firstName, lastName := splitDisplayName(input.Name)
	if firstName == "" {
		firstName = existing.FirstName
	}
	if lastName == "" {
		lastName = existing.LastName
	}
	if input.Email == "" {
		input.Email = existing.Email
	}
	member := models.WorkspaceMember{
		MembershipID:   id,
		OrganisationID: claims.OrganisationID,
		Email:          input.Email,
		FirstName:      firstName,
		LastName:       lastName,
		Phone:          input.Phone,
		JobTitle:       input.Title,
		Status:         defaultString(input.Status, existing.Status),
	}
	if err := a.Repo.UpdateWorkspaceMember(r.Context(), &member); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update user")
		return
	}
	roleIDs := normalizedRoleIDs(input.RoleIDs, input.RoleID)
	if len(roleIDs) > 0 {
		if err := a.Repo.SetMembershipRoles(r.Context(), claims.OrganisationID, id, roleIDs); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not assign roles")
			return
		}
	}
	updated, _ := a.Repo.GetWorkspaceMember(r.Context(), claims.OrganisationID, id)
	if updated == nil {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "updated"})
		return
	}
	httpx.JSON(w, http.StatusOK, settingsUserFromMember(*updated))
}

func (a *App) deleteSettingsUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE organisation_memberships
		SET status = 'removed', deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete user")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "User removed."})
}

func (a *App) sendSettingsUserInvite(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusAccepted, map[string]string{"message": "Invite queued."})
}

func (a *App) resetSettingsUserPassword(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusAccepted, map[string]string{"message": "Password reset queued."})
}

func settingsUserFromMember(member models.WorkspaceMember) settingsUserResponse {
	roleIDs := make([]int64, 0, len(member.Roles))
	for _, role := range member.Roles {
		roleIDs = append(roleIDs, role.ID)
	}
	var roleID *int64
	if len(roleIDs) > 0 {
		roleID = &roleIDs[0]
	}
	name := strings.TrimSpace(member.FirstName + " " + member.LastName)
	if member.DisplayName != nil && strings.TrimSpace(*member.DisplayName) != "" {
		name = strings.TrimSpace(*member.DisplayName)
	}
	return settingsUserResponse{
		ID:      member.MembershipID,
		Name:    name,
		Email:   member.Email,
		Phone:   member.Phone,
		RoleID:  roleID,
		RoleIDs: roleIDs,
		Status:  member.Status,
		Title:   member.JobTitle,
	}
}

func splitDisplayName(name string) (string, string) {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], parts[0]
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func normalizedRoleIDs(roleIDs []int64, roleID *int64) []int64 {
	if len(roleIDs) == 0 && roleID != nil {
		roleIDs = []int64{*roleID}
	}
	out := make([]int64, 0, len(roleIDs))
	seen := map[int64]bool{}
	for _, id := range roleIDs {
		if id > 0 && !seen[id] {
			out = append(out, id)
			seen[id] = true
		}
	}
	return out
}

type settingsRoleResponse struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

type settingsRoleRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
}

func (a *App) listSettingsRoles(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	roles, err := querySettingsRoles(r.Context(), a.Repo.Connection(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list roles")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"roles": roles})
}

func (a *App) createSettingsRole(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input settingsRoleRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || strings.TrimSpace(input.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	role, err := upsertSettingsRole(r.Context(), a.Repo.Connection(), claims.OrganisationID, 0, input)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create role")
		return
	}
	httpx.JSON(w, http.StatusCreated, role)
}

func (a *App) updateSettingsRole(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input settingsRoleRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || strings.TrimSpace(input.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	role, err := upsertSettingsRole(r.Context(), a.Repo.Connection(), claims.OrganisationID, id, input)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update role")
		return
	}
	httpx.JSON(w, http.StatusOK, role)
}

func (a *App) deleteSettingsRole(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	result, err := a.Repo.Connection().ExecContext(r.Context(), `
		DELETE FROM roles
		WHERE organisation_id = $1
			AND id = $2
			AND system_role = false
	`, claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete role")
		return
	}
	if rows, _ := result.RowsAffected(); rows == 0 {
		httpx.Error(w, http.StatusBadRequest, "system role cannot be deleted")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Role deleted."})
}

func (a *App) getEffectiveSettingsPermissions(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	roleIDs, permissions, err := queryEffectivePermissions(r.Context(), a.Repo.Connection(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load effective permissions")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"user_id":     id,
		"role_ids":    roleIDs,
		"permissions": permissions,
	})
}

func querySettingsRoles(ctx context.Context, db *sql.DB, organisationID int64) ([]settingsRoleResponse, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT
			r.id,
			r.name,
			COALESCE(r.slug, '') AS description,
			p.slug
		FROM roles r
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE r.organisation_id = $1
		ORDER BY r.system_role DESC, r.name ASC, p.slug ASC
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]settingsRoleResponse, 0)
	byID := map[int64]int{}
	for rows.Next() {
		var roleID int64
		var name, description string
		var permission sql.NullString
		if err := rows.Scan(&roleID, &name, &description, &permission); err != nil {
			return nil, err
		}
		idx, ok := byID[roleID]
		if !ok {
			idx = len(roles)
			byID[roleID] = idx
			roles = append(roles, settingsRoleResponse{
				ID:          roleID,
				Name:        name,
				Description: description,
				Permissions: []string{},
			})
		}
		if permission.Valid {
			roles[idx].Permissions = append(roles[idx].Permissions, permission.String)
		}
	}
	return roles, rows.Err()
}

func upsertSettingsRole(ctx context.Context, db *sql.DB, organisationID, roleID int64, input settingsRoleRequest) (*settingsRoleResponse, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	slug := slugify(input.Name)
	if roleID == 0 {
		err = tx.QueryRowContext(ctx, `
			INSERT INTO roles (organisation_id, slug, name, system_role)
			VALUES ($1, $2, $3, false)
			RETURNING id
		`, organisationID, slug, strings.TrimSpace(input.Name)).Scan(&roleID)
	} else {
		_, err = tx.ExecContext(ctx, `
			UPDATE roles
			SET slug = $3, name = $4
			WHERE organisation_id = $1
				AND id = $2
		`, organisationID, roleID, slug, strings.TrimSpace(input.Name))
	}
	if err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM role_permissions WHERE role_id = $1`, roleID); err != nil {
		return nil, err
	}
	for _, permission := range input.Permissions {
		permission = strings.TrimSpace(permission)
		if permission == "" {
			continue
		}
		var permissionID int64
		if err := tx.QueryRowContext(ctx, `
			INSERT INTO permissions (slug, description)
			VALUES ($1, $1)
			ON CONFLICT (slug) DO UPDATE SET description = COALESCE(permissions.description, EXCLUDED.description)
			RETURNING id
		`, permission).Scan(&permissionID); err != nil {
			return nil, err
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO role_permissions (role_id, permission_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, roleID, permissionID); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	roles, err := querySettingsRoles(ctx, db, organisationID)
	if err != nil {
		return nil, err
	}
	for _, role := range roles {
		if role.ID == roleID {
			return &role, nil
		}
	}
	return nil, sql.ErrNoRows
}

func queryEffectivePermissions(ctx context.Context, db *sql.DB, organisationID, membershipID int64) ([]int64, []string, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT DISTINCT r.id, p.slug
		FROM organisation_memberships m
		JOIN membership_roles mr ON mr.membership_id = m.id
		JOIN roles r ON r.id = mr.role_id AND r.organisation_id = m.organisation_id
		LEFT JOIN role_permissions rp ON rp.role_id = r.id
		LEFT JOIN permissions p ON p.id = rp.permission_id
		WHERE m.organisation_id = $1
			AND m.id = $2
			AND m.deleted_at IS NULL
		ORDER BY r.id, p.slug
	`, organisationID, membershipID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	roleIDs := make([]int64, 0)
	permissions := make([]string, 0)
	seenRoles := map[int64]bool{}
	seenPerms := map[string]bool{}
	for rows.Next() {
		var roleID int64
		var permission sql.NullString
		if err := rows.Scan(&roleID, &permission); err != nil {
			return nil, nil, err
		}
		if !seenRoles[roleID] {
			roleIDs = append(roleIDs, roleID)
			seenRoles[roleID] = true
		}
		if permission.Valid && !seenPerms[permission.String] {
			permissions = append(permissions, permission.String)
			seenPerms[permission.String] = true
		}
	}
	return roleIDs, permissions, rows.Err()
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	lastDash := false
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash {
			b.WriteByte('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
