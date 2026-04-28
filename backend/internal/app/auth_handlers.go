package app

import (
	"backend/internal/models"
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"errors"
	"net/http"
	"time"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	AccessToken string              `json:"access_token"`
	TokenType   string              `json:"token_type"`
	Account     *accountResponse    `json:"account,omitempty"`
	Admin       *adminResponse      `json:"admin,omitempty"`
	Workspace   *workspaceResponse  `json:"workspace,omitempty"`
	Workspaces  []workspaceResponse `json:"workspaces,omitempty"`
}

type accountResponse struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type adminResponse struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type workspaceResponse struct {
	MembershipID   int64  `json:"membership_id"`
	OrganisationID int64  `json:"organisation_id"`
	Name           string `json:"name"`
	RoleLabel      string `json:"role_label"`
}

func (a *App) loginAccount(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	account, err := a.Repo.GetAccountByEmail(r.Context(), input.Email)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !auth.CheckPassword(account.PasswordHash, input.Password) {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	workspaces, err := a.Repo.ListAccountWorkspaces(r.Context(), account.ID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load workspaces")
		return
	}
	if len(workspaces) == 0 {
		httpx.Error(w, http.StatusForbidden, "account has no active workspace")
		return
	}

	selected := workspaces[0]
	token, err := a.Tokens.AccountToken(account.ID, selected.OrganisationID, selected.MembershipID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create access token")
		return
	}
	if err := a.issueAccountRefreshCookie(w, r, account.ID, selected.OrganisationID, selected.MembershipID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
		return
	}
	_ = a.Repo.UpdateAccountLastLogin(r.Context(), account.ID)

	httpx.JSON(w, http.StatusOK, loginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Account:     accountPayload(account),
		Workspace:   workspacePayload(&selected),
		Workspaces:  workspacePayloads(workspaces),
	})
}

func (a *App) loginAdmin(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	admin, err := a.Repo.GetAdminByEmail(r.Context(), input.Email)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !auth.CheckPassword(admin.PasswordHash, input.Password) {
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := a.Tokens.AdminToken(admin.ID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create access token")
		return
	}
	if err := a.issueAdminRefreshCookie(w, r, admin.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
		return
	}

	httpx.JSON(w, http.StatusOK, loginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Admin:       adminPayload(admin),
	})
}

func (a *App) refreshToken(w http.ResponseWriter, r *http.Request) {
	claims, err := a.refreshClaimsFromCookie(r)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	session, err := a.Repo.GetRefreshSessionByJTI(r.Context(), claims.ID)
	if err != nil {
		httpx.Error(w, http.StatusUnauthorized, "refresh session unavailable")
		return
	}
	if err := validateRefreshSession(claims, session); err != nil {
		httpx.Error(w, http.StatusUnauthorized, "refresh session mismatch")
		return
	}
	if err := a.Repo.RevokeRefreshSessionByJTI(r.Context(), claims.ID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not rotate refresh session")
		return
	}

	switch claims.ActorType {
	case "account":
		if session.ActiveOrganisationID == nil || session.ActiveMembershipID == nil {
			httpx.Error(w, http.StatusUnauthorized, "refresh session has no active workspace")
			return
		}
		workspace, err := a.Repo.GetAccountWorkspace(r.Context(), session.SubjectID, *session.ActiveOrganisationID)
		if err != nil || workspace.MembershipID != *session.ActiveMembershipID {
			httpx.Error(w, http.StatusUnauthorized, "workspace unavailable")
			return
		}
		token, err := a.Tokens.AccountToken(session.SubjectID, workspace.OrganisationID, workspace.MembershipID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create access token")
			return
		}
		if err := a.issueAccountRefreshCookie(w, r, session.SubjectID, workspace.OrganisationID, workspace.MembershipID); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
			return
		}
		httpx.JSON(w, http.StatusOK, loginResponse{
			AccessToken: token,
			TokenType:   "Bearer",
			Workspace:   workspacePayload(workspace),
		})
	case "admin":
		if _, err := a.Repo.GetAdminByID(r.Context(), session.SubjectID); err != nil {
			httpx.Error(w, http.StatusUnauthorized, "admin unavailable")
			return
		}
		token, err := a.Tokens.AdminToken(session.SubjectID)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create access token")
			return
		}
		if err := a.issueAdminRefreshCookie(w, r, session.SubjectID); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
			return
		}
		httpx.JSON(w, http.StatusOK, loginResponse{
			AccessToken: token,
			TokenType:   "Bearer",
		})
	default:
		httpx.Error(w, http.StatusUnauthorized, "invalid refresh token")
	}
}

func (a *App) logout(w http.ResponseWriter, r *http.Request) {
	claims, err := a.refreshClaimsFromCookie(r)
	if err == nil && claims.ID != "" {
		if err := a.Repo.RevokeRefreshSessionByJTI(r.Context(), claims.ID); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not revoke refresh session")
			return
		}
	}

	http.SetCookie(w, a.expiredRefreshCookie())
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "logged_out"})
}

func (a *App) authMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "missing authentication")
		return
	}
	httpx.JSON(w, http.StatusOK, claims)
}

func (a *App) listAccountOrganisations(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" {
		httpx.Error(w, http.StatusForbidden, "account token required")
		return
	}

	workspaces, err := a.Repo.ListAccountWorkspaces(r.Context(), claims.AccountID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load workspaces")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]any{"workspaces": workspacePayloads(workspaces)})
}

type switchOrganisationRequest struct {
	OrganisationID int64 `json:"organisation_id"`
}

func (a *App) switchOrganisation(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" {
		httpx.Error(w, http.StatusForbidden, "account token required")
		return
	}

	var input switchOrganisationRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || input.OrganisationID == 0 {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	workspace, err := a.Repo.GetAccountWorkspace(r.Context(), claims.AccountID, input.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusForbidden, "workspace unavailable")
		return
	}

	token, err := a.Tokens.AccountToken(claims.AccountID, workspace.OrganisationID, workspace.MembershipID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create access token")
		return
	}
	if err := a.issueAccountRefreshCookie(w, r, claims.AccountID, workspace.OrganisationID, workspace.MembershipID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
		return
	}

	httpx.JSON(w, http.StatusOK, loginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Workspace:   workspacePayload(workspace),
	})
}

func accountPayload(account *models.Account) *accountResponse {
	return &accountResponse{
		ID:        account.ID,
		Email:     account.Email,
		FirstName: account.FirstName,
		LastName:  account.LastName,
	}
}

func adminPayload(admin *models.Admin) *adminResponse {
	return &adminResponse{
		ID:        admin.ID,
		Email:     admin.Email,
		FirstName: admin.FirstName,
		LastName:  admin.LastName,
	}
}

func workspacePayload(workspace *models.AccountWorkspace) *workspaceResponse {
	if workspace == nil {
		return nil
	}

	roleLabel := ""
	if workspace.JobTitle != nil {
		roleLabel = *workspace.JobTitle
	}

	return &workspaceResponse{
		MembershipID:   workspace.MembershipID,
		OrganisationID: workspace.OrganisationID,
		Name:           workspace.Organisation,
		RoleLabel:      roleLabel,
	}
}

func workspacePayloads(workspaces []models.AccountWorkspace) []workspaceResponse {
	out := make([]workspaceResponse, 0, len(workspaces))
	for i := range workspaces {
		out = append(out, *workspacePayload(&workspaces[i]))
	}
	return out
}

func (a *App) refreshClaimsFromCookie(r *http.Request) (*auth.Claims, error) {
	cookie, err := r.Cookie(a.Config.RefreshCookieName)
	if err != nil || cookie.Value == "" {
		return nil, errors.New("missing refresh cookie")
	}

	claims, err := a.Tokens.Parse(cookie.Value)
	if err != nil {
		return nil, err
	}
	if claims.TokenUse != "refresh" || claims.ID == "" {
		return nil, errors.New("refresh token required")
	}
	return claims, nil
}

func validateRefreshSession(claims *auth.Claims, session *models.RefreshSession) error {
	if claims.ActorType != session.ActorType {
		return errors.New("actor type mismatch")
	}
	switch claims.ActorType {
	case "account":
		if claims.AccountID != session.SubjectID {
			return errors.New("subject mismatch")
		}
		if session.ActiveOrganisationID == nil || claims.OrganisationID != *session.ActiveOrganisationID {
			return errors.New("organisation mismatch")
		}
		if session.ActiveMembershipID == nil || claims.MembershipID != *session.ActiveMembershipID {
			return errors.New("membership mismatch")
		}
	case "admin":
		if claims.AdminID != session.SubjectID {
			return errors.New("subject mismatch")
		}
	default:
		return errors.New("invalid actor type")
	}
	return nil
}

func (a *App) issueAccountRefreshCookie(w http.ResponseWriter, r *http.Request, accountID, organisationID, membershipID int64) error {
	refreshToken, jti, expiresAt, err := a.Tokens.AccountRefreshToken(accountID, organisationID, membershipID, a.Config.RefreshTokenTTL)
	if err != nil {
		return err
	}

	session := &models.RefreshSession{
		JTI:                  jti,
		ActorType:            "account",
		SubjectID:            accountID,
		ActiveOrganisationID: int64Ptr(organisationID),
		ActiveMembershipID:   int64Ptr(membershipID),
		ExpiresAt:            expiresAt,
	}
	if err := a.Repo.CreateRefreshSession(r.Context(), session); err != nil {
		return err
	}

	http.SetCookie(w, a.refreshCookie(refreshToken, expiresAt))
	return nil
}

func (a *App) issueAdminRefreshCookie(w http.ResponseWriter, r *http.Request, adminID int64) error {
	refreshToken, jti, expiresAt, err := a.Tokens.AdminRefreshToken(adminID, a.Config.RefreshTokenTTL)
	if err != nil {
		return err
	}

	session := &models.RefreshSession{
		JTI:       jti,
		ActorType: "admin",
		SubjectID: adminID,
		ExpiresAt: expiresAt,
	}
	if err := a.Repo.CreateRefreshSession(r.Context(), session); err != nil {
		return err
	}

	http.SetCookie(w, a.refreshCookie(refreshToken, expiresAt))
	return nil
}

func (a *App) refreshCookie(value string, expiresAt time.Time) *http.Cookie {
	return &http.Cookie{
		Name:     a.Config.RefreshCookieName,
		Value:    value,
		Path:     a.Config.RefreshCookiePath,
		Domain:   a.Config.RefreshCookieDomain,
		Expires:  expiresAt,
		MaxAge:   int(time.Until(expiresAt).Seconds()),
		HttpOnly: true,
		Secure:   a.Config.RefreshCookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
}

func (a *App) expiredRefreshCookie() *http.Cookie {
	return &http.Cookie{
		Name:     a.Config.RefreshCookieName,
		Value:    "",
		Path:     a.Config.RefreshCookiePath,
		Domain:   a.Config.RefreshCookieDomain,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   a.Config.RefreshCookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
}

func int64Ptr(value int64) *int64 {
	return &value
}
