package app

import (
	"backend/internal/models"
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"context"
	"database/sql"
	"net/http"
	"strings"
	"time"
)

func (a *App) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := claimsFromContext(r.Context())
		if !ok || claims.ActorType != "admin" {
			httpx.Error(w, http.StatusForbidden, "platform admin token required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

type adminDashboardResponse struct {
	KPIs                adminDashboardKPIs           `json:"kpis"`
	RecentOrganisations []adminDashboardOrganisation `json:"recent_organisations"`
	RecentEvents        []adminDashboardEvent        `json:"recent_events"`
	JobsStatus          adminDashboardJobsStatus     `json:"jobs_status"`
}

type adminDashboardKPIs struct {
	Organisations          int `json:"organisations"`
	ActiveOrganisations    int `json:"active_organisations"`
	SuspendedOrganisations int `json:"suspended_organisations"`
	Users                  int `json:"users"`
	JobsRunning            int `json:"jobs_running"`
	EventsToday            int `json:"events_today"`
}

type adminDashboardOrganisation struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Plan      string    `json:"plan"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	Employees int       `json:"employees"`
}

type adminDashboardEvent struct {
	ID             int64     `json:"id"`
	ActorName      string    `json:"actor_name"`
	Action         string    `json:"action"`
	OrganisationID int64     `json:"organisation_id"`
	EntityType     string    `json:"entity_type"`
	CreatedAt      time.Time `json:"created_at"`
	Details        string    `json:"details,omitempty"`
}

type adminDashboardJobsStatus struct {
	Running   int `json:"running"`
	Succeeded int `json:"succeeded"`
	Failed    int `json:"failed"`
}

func (a *App) getAdminDashboard(w http.ResponseWriter, r *http.Request) {
	organisations, err := a.Repo.ListOrganisations(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load dashboard organisations")
		return
	}

	response := adminDashboardResponse{
		KPIs: adminDashboardKPIs{
			Organisations: len(organisations),
		},
		RecentOrganisations: make([]adminDashboardOrganisation, 0, minInt(len(organisations), 5)),
		RecentEvents:        make([]adminDashboardEvent, 0),
	}

	for _, organisation := range organisations {
		switch organisation.Status {
		case "active", "trialing":
			response.KPIs.ActiveOrganisations++
		case "suspended", "inactive", "archived":
			response.KPIs.SuspendedOrganisations++
		}
		if len(response.RecentOrganisations) < 5 {
			response.RecentOrganisations = append(response.RecentOrganisations, adminDashboardOrganisation{
				ID:        organisation.ID,
				Name:      organisation.Name,
				Plan:      "Free",
				Status:    organisation.Status,
				CreatedAt: organisation.CreatedAt,
				Employees: countOrganisationMembers(r.Context(), a.Repo.Connection(), organisation.ID),
			})
		}
	}

	db := a.Repo.Connection()
	response.KPIs.Users = countRows(r.Context(), db, `
		SELECT count(*)
		FROM accounts
		WHERE deleted_at IS NULL
	`)
	response.KPIs.JobsRunning = countRows(r.Context(), db, `
		SELECT count(*)
		FROM job_runs
		WHERE status = 'running'
	`)
	response.KPIs.EventsToday = countRows(r.Context(), db, `
		SELECT count(*)
		FROM events
		WHERE created_at >= date_trunc('day', now())
	`)
	response.JobsStatus = adminDashboardJobsStatus{
		Running: response.KPIs.JobsRunning,
		Succeeded: countRows(r.Context(), db, `
			SELECT count(*)
			FROM job_runs
			WHERE status IN ('success', 'succeeded')
		`),
		Failed: countRows(r.Context(), db, `
			SELECT count(*)
			FROM job_runs
			WHERE status = 'failed'
		`),
	}
	response.RecentEvents = listAdminDashboardEvents(r.Context(), db)

	httpx.JSON(w, http.StatusOK, response)
}

type adminUserResponse struct {
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	Status         string     `json:"status"`
	Type           string     `json:"type,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	Title          *string    `json:"title,omitempty"`
	OrganisationID *int64     `json:"organisation_id,omitempty"`
	DateAdded      *time.Time `json:"date_added,omitempty"`
}

type adminUserRequest struct {
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Type           string `json:"type"`
	Status         string `json:"status"`
	OrganisationID int64  `json:"organisation_id"`
	Title          string `json:"title"`
	Password       string `json:"password"`
}

func (a *App) listAdminUsers(w http.ResponseWriter, r *http.Request) {
	users, err := queryAdminUsers(r.Context(), a.Repo.Connection())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list users")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"users": users})
}

func (a *App) createAdminUser(w http.ResponseWriter, r *http.Request) {
	var input adminUserRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.normalize()
	if input.FirstName == "" && input.LastName == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Email == "" {
		httpx.Error(w, http.StatusBadRequest, "email is required")
		return
	}
	if input.Password == "" {
		httpx.Error(w, http.StatusBadRequest, "password is required")
		return
	}
	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not hash password")
		return
	}

	user, err := insertAdminUser(r.Context(), a.Repo.Connection(), input, passwordHash)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create user")
		return
	}
	httpx.JSON(w, http.StatusCreated, user)
}

func (a *App) updateAdminUser(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input adminUserRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.normalize()
	user, err := updateAdminUserRecord(r.Context(), a.Repo.Connection(), id, input)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update user")
		return
	}
	httpx.JSON(w, http.StatusOK, user)
}

func (a *App) deleteAdminUser(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := softDeleteAdminUser(r.Context(), a.Repo.Connection(), id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete user")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "User deleted."})
}

func (a *App) impersonateAdminUser(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	exists := countRows(r.Context(), a.Repo.Connection(), `
		SELECT count(*)
		FROM accounts
		WHERE id = $1
			AND deleted_at IS NULL
	`, id)
	if exists == 0 {
		httpx.Error(w, http.StatusNotFound, "user not found")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"message":    "Impersonation request accepted.",
		"user_id":    id,
		"expires_at": time.Now().Add(time.Hour).Format(time.RFC3339),
	})
}

func countRows(ctx context.Context, db *sql.DB, query string, args ...any) int {
	var count int
	if err := db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return 0
	}
	return count
}

func countOrganisationMembers(ctx context.Context, db *sql.DB, organisationID int64) int {
	return countRows(ctx, db, `
		SELECT count(*)
		FROM organisation_memberships
		WHERE organisation_id = $1
			AND deleted_at IS NULL
	`, organisationID)
}

func listAdminDashboardEvents(ctx context.Context, db *sql.DB) []adminDashboardEvent {
	rows, err := db.QueryContext(ctx, `
		SELECT
			id,
			COALESCE(actor_type, 'system') AS actor_name,
			event_type,
			COALESCE(organisation_id, 0),
			COALESCE(entity_type, ''),
			created_at,
			COALESCE(data::text, '')
		FROM events
		ORDER BY created_at DESC, id DESC
		LIMIT 5
	`)
	if err != nil {
		return []adminDashboardEvent{}
	}
	defer rows.Close()

	events := make([]adminDashboardEvent, 0, 5)
	for rows.Next() {
		var event adminDashboardEvent
		if err := rows.Scan(
			&event.ID,
			&event.ActorName,
			&event.Action,
			&event.OrganisationID,
			&event.EntityType,
			&event.CreatedAt,
			&event.Details,
		); err != nil {
			return events
		}
		events = append(events, event)
	}
	return events
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (input *adminUserRequest) normalize() {
	input.FirstName = strings.TrimSpace(input.FirstName)
	input.LastName = strings.TrimSpace(input.LastName)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)
	input.Type = strings.TrimSpace(input.Type)
	input.Status = strings.TrimSpace(input.Status)
	input.Title = strings.TrimSpace(input.Title)
}

func queryAdminUsers(ctx context.Context, db *sql.DB) ([]adminUserResponse, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT
			a.id,
			trim(concat(a.first_name, ' ', a.last_name)) AS name,
			a.email,
			a.status,
			a.phone,
			m.organisation_id,
			m.job_title,
			COALESCE(ec.name, ''),
			a.created_at
		FROM accounts a
		LEFT JOIN LATERAL (
			SELECT organisation_id, employee_category_id, job_title
			FROM organisation_memberships
			WHERE account_id = a.id
				AND deleted_at IS NULL
			ORDER BY created_at DESC, id DESC
			LIMIT 1
		) m ON true
		LEFT JOIN employee_categories ec ON ec.id = m.employee_category_id
		WHERE a.deleted_at IS NULL
		ORDER BY a.created_at DESC, a.id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]adminUserResponse, 0)
	for rows.Next() {
		var user adminUserResponse
		var userType string
		if err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.Status,
			&user.Phone,
			&user.OrganisationID,
			&user.Title,
			&userType,
			&user.DateAdded,
		); err != nil {
			return nil, err
		}
		if userType == "" {
			user.Type = "employee"
		} else {
			user.Type = userType
		}
		users = append(users, user)
	}
	return users, rows.Err()
}

func insertAdminUser(ctx context.Context, db *sql.DB, input adminUserRequest, passwordHash string) (*adminUserResponse, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	status := accountStatus(input.Status)
	var phone *string
	if input.Phone != "" {
		phone = &input.Phone
	}
	var accountID int64
	var createdAt time.Time
	err = tx.QueryRowContext(ctx, `
		INSERT INTO accounts (email, password_hash, first_name, last_name, phone, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, input.Email, passwordHash, input.FirstName, input.LastName, phone, status).Scan(&accountID, &createdAt)
	if err != nil {
		return nil, err
	}

	if input.OrganisationID > 0 {
		var title *string
		if input.Title != "" {
			title = &input.Title
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO organisation_memberships (organisation_id, account_id, job_title, status, joined_at)
			VALUES ($1, $2, $3, $4, now())
		`, input.OrganisationID, accountID, title, membershipStatus(input.Status))
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &adminUserResponse{
		ID:             accountID,
		Name:           strings.TrimSpace(input.FirstName + " " + input.LastName),
		Email:          input.Email,
		Status:         status,
		Type:           defaultString(input.Type, "employee"),
		Phone:          phone,
		Title:          stringPtrOrNil(input.Title),
		OrganisationID: int64PtrOrNil(input.OrganisationID),
		DateAdded:      &createdAt,
	}, nil
}

func updateAdminUserRecord(ctx context.Context, db *sql.DB, accountID int64, input adminUserRequest) (*adminUserResponse, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var phone *string
	if input.Phone != "" {
		phone = &input.Phone
	}
	var firstName, lastName, email, status string
	var createdAt time.Time
	err = tx.QueryRowContext(ctx, `
		UPDATE accounts
		SET first_name = COALESCE(NULLIF($2, ''), first_name),
			last_name = COALESCE(NULLIF($3, ''), last_name),
			email = COALESCE(NULLIF($4, ''), email),
			phone = $5,
			status = COALESCE(NULLIF($6, ''), status),
			updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
		RETURNING first_name, last_name, email, status, created_at
	`, accountID, input.FirstName, input.LastName, input.Email, phone, accountStatus(input.Status)).Scan(&firstName, &lastName, &email, &status, &createdAt)
	if err != nil {
		return nil, err
	}

	if input.OrganisationID > 0 {
		var title *string
		if input.Title != "" {
			title = &input.Title
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO organisation_memberships (organisation_id, account_id, job_title, status, joined_at)
			VALUES ($1, $2, $3, $4, now())
			ON CONFLICT (organisation_id, account_id) WHERE deleted_at IS NULL
			DO UPDATE SET job_title = EXCLUDED.job_title,
				status = EXCLUDED.status,
				updated_at = now()
		`, input.OrganisationID, accountID, title, membershipStatus(input.Status))
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &adminUserResponse{
		ID:             accountID,
		Name:           strings.TrimSpace(firstName + " " + lastName),
		Email:          email,
		Status:         status,
		Type:           defaultString(input.Type, "employee"),
		Phone:          phone,
		Title:          stringPtrOrNil(input.Title),
		OrganisationID: int64PtrOrNil(input.OrganisationID),
		DateAdded:      &createdAt,
	}, nil
}

func softDeleteAdminUser(ctx context.Context, db *sql.DB, accountID int64) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `
		UPDATE accounts
		SET status = 'deleted', deleted_at = now(), updated_at = now()
		WHERE id = $1
			AND deleted_at IS NULL
	`, accountID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE organisation_memberships
		SET status = 'removed', deleted_at = now(), updated_at = now()
		WHERE account_id = $1
			AND deleted_at IS NULL
	`, accountID); err != nil {
		return err
	}
	return tx.Commit()
}

func accountStatus(status string) string {
	switch status {
	case "suspended", "inactive":
		return "suspended"
	case "deleted", "archived", "removed":
		return "deleted"
	case "active":
		return "active"
	default:
		return "active"
	}
}

func membershipStatus(status string) string {
	switch status {
	case "suspended", "inactive":
		return "suspended"
	case "deleted", "archived", "removed":
		return "removed"
	case "invited":
		return "invited"
	default:
		return "active"
	}
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func stringPtrOrNil(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func int64PtrOrNil(value int64) *int64 {
	if value == 0 {
		return nil
	}
	return &value
}

func (a *App) listAdminOrganisations(w http.ResponseWriter, r *http.Request) {
	organisations, err := a.Repo.ListOrganisations(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisations")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"organisations": organisations})
}

func (a *App) createAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	var organisation models.Organisation
	if err := httpx.DecodeJSON(r, &organisation); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if organisation.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if err := a.Repo.CreateOrganisation(r.Context(), &organisation); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create organisation")
		return
	}
	httpx.JSON(w, http.StatusCreated, organisation)
}

func (a *App) getAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	organisation, err := a.Repo.GetOrganisationByID(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "organisation not found")
		return
	}
	httpx.JSON(w, http.StatusOK, organisation)
}

type statusRequest struct {
	Status string `json:"status"`
}

func (a *App) updateAdminOrganisationStatus(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input statusRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || input.Status == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := a.Repo.UpdateOrganisationStatus(r.Context(), id, input.Status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update organisation status")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) listAdminOrganisationFeatures(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	features, err := a.Repo.ListOrganisationFeatures(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation features")
		return
	}
	limits, err := a.Repo.ListOrganisationFeatureLimits(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation feature limits")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"features": features, "limits": limits})
}

func (a *App) listAdminOrganisationSubscriptions(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	subscriptions, err := a.Repo.ListOrganisationSubscriptions(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation subscriptions")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"subscriptions": subscriptions})
}
