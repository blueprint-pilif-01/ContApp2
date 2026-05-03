package app

import (
	"backend/internal/dto"
	"backend/internal/models"
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"database/sql"
	"errors"
	"net/http"
	"time"
)

const (
	accountAccessCookieName = "account_access_token"
	adminAccessCookieName   = "admin_access_token"
)

func (a *App) loginAccount(w http.ResponseWriter, r *http.Request) {
	var input dto.LoginRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		a.Logger.Warn("account login rejected", "reason", "invalid_body", "remote_addr", r.RemoteAddr)
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.Normalize()

	account, err := a.Repo.GetAccountByEmail(r.Context(), input.Email)
	if err != nil {
		a.logAuthFailure("account", input.Email, r, "email_not_found", err)
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !auth.CheckPassword(account.PasswordHash, input.Password) {
		a.logAuthFailure("account", input.Email, r, "password_mismatch", nil)
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	workspaces, err := a.Repo.ListAccountWorkspaces(r.Context(), account.ID)
	if err != nil {
		a.Logger.Error("account login failed", "reason", "workspace_lookup_failed", "account_id", account.ID, "email", input.Email, "remote_addr", r.RemoteAddr, "error", err)
		httpx.Error(w, http.StatusInternalServerError, "could not load workspaces")
		return
	}
	if len(workspaces) == 0 {
		a.Logger.Warn("account login rejected", "reason", "no_active_workspace", "account_id", account.ID, "email", input.Email, "remote_addr", r.RemoteAddr)
		httpx.Error(w, http.StatusForbidden, "account has no active workspace")
		return
	}

	selected := workspaces[0]
	token, err := a.Tokens.AccountToken(account.ID, selected.OrganisationID, selected.MembershipID)
	if err != nil {
		a.Logger.Error("account login failed", "reason", "access_token_create_failed", "account_id", account.ID, "organisation_id", selected.OrganisationID, "membership_id", selected.MembershipID, "error", err)
		httpx.Error(w, http.StatusInternalServerError, "could not create access token")
		return
	}
	if err := a.issueAccountRefreshCookie(w, r, account.ID, selected.OrganisationID, selected.MembershipID); err != nil {
		a.Logger.Error("account login failed", "reason", "refresh_session_create_failed", "account_id", account.ID, "organisation_id", selected.OrganisationID, "membership_id", selected.MembershipID, "error", err)
		httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
		return
	}
	http.SetCookie(w, a.accessCookie(accountAccessCookieName, token))
	_ = a.Repo.UpdateAccountLastLogin(r.Context(), account.ID)
	a.Logger.Info("account login succeeded", "account_id", account.ID, "email", account.Email, "organisation_id", selected.OrganisationID, "membership_id", selected.MembershipID, "remote_addr", r.RemoteAddr)

	httpx.JSON(w, http.StatusOK, dto.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Account:     dto.AccountFromModel(account),
		Workspace:   dto.WorkspaceFromModel(&selected),
		Workspaces:  dto.WorkspacesFromModels(workspaces),
	})
}

func (a *App) loginAdmin(w http.ResponseWriter, r *http.Request) {
	var input dto.LoginRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		a.Logger.Warn("admin login rejected", "reason", "invalid_body", "remote_addr", r.RemoteAddr)
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.Normalize()

	admin, err := a.Repo.GetAdminByEmail(r.Context(), input.Email)
	if err != nil {
		a.logAuthFailure("admin", input.Email, r, "email_not_found", err)
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if !auth.CheckPassword(admin.PasswordHash, input.Password) {
		a.logAuthFailure("admin", input.Email, r, "password_mismatch", nil)
		httpx.Error(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := a.Tokens.AdminToken(admin.ID)
	if err != nil {
		a.Logger.Error("admin login failed", "reason", "access_token_create_failed", "admin_id", admin.ID, "error", err)
		httpx.Error(w, http.StatusInternalServerError, "could not create access token")
		return
	}
	if err := a.issueAdminRefreshCookie(w, r, admin.ID); err != nil {
		a.Logger.Error("admin login failed", "reason", "refresh_session_create_failed", "admin_id", admin.ID, "error", err)
		httpx.Error(w, http.StatusInternalServerError, "could not create refresh session")
		return
	}
	http.SetCookie(w, a.accessCookie(adminAccessCookieName, token))
	a.Logger.Info("admin login succeeded", "admin_id", admin.ID, "email", admin.Email, "remote_addr", r.RemoteAddr)

	httpx.JSON(w, http.StatusOK, dto.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Admin:       dto.AdminFromModel(admin),
	})
}

func (a *App) logAuthFailure(actorType, email string, r *http.Request, reason string, err error) {
	args := []any{
		"actor_type", actorType,
		"reason", reason,
		"email", email,
		"remote_addr", r.RemoteAddr,
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		args = append(args, "error", err)
		a.Logger.Error("login failed", args...)
		return
	}
	a.Logger.Warn("login rejected", args...)
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
		http.SetCookie(w, a.accessCookie(accountAccessCookieName, token))
		httpx.JSON(w, http.StatusOK, dto.LoginResponse{
			AccessToken: token,
			TokenType:   "Bearer",
			Workspace:   dto.WorkspaceFromModel(workspace),
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
		http.SetCookie(w, a.accessCookie(adminAccessCookieName, token))
		httpx.JSON(w, http.StatusOK, dto.LoginResponse{
			AccessToken: token,
			TokenType:   "Bearer",
		})
	default:
		httpx.Error(w, http.StatusUnauthorized, "invalid refresh token")
	}
}

func (a *App) logout(w http.ResponseWriter, r *http.Request) {
	logoutAt := time.Now().UTC()
	logoutRecorded := false

	claims, err := a.refreshClaimsFromCookie(r)
	if err == nil && claims.ID != "" {
		if err := a.Repo.RevokeRefreshSessionByJTI(r.Context(), claims.ID); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not revoke refresh session")
			return
		}
		if err := a.recordAccessTokenLogout(r, claims, logoutAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not revoke access token")
			return
		}
		logoutRecorded = true
	}

	if accessToken := bearerToken(r); accessToken != "" {
		accessClaims, err := a.Tokens.Parse(accessToken)
		if err == nil && accessClaims.TokenUse == "access" {
			if err := a.recordAccessTokenLogout(r, accessClaims, logoutAt); err != nil {
				httpx.Error(w, http.StatusInternalServerError, "could not revoke access token")
				return
			}
			logoutRecorded = true
		}
	}

	http.SetCookie(w, a.expiredRefreshCookie())
	http.SetCookie(w, a.expiredAccessCookie(accountAccessCookieName))
	http.SetCookie(w, a.expiredAccessCookie(adminAccessCookieName))
	if logoutRecorded {
		a.Logger.Info("logout succeeded", "remote_addr", r.RemoteAddr)
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "logged_out"})
}

func (a *App) recordAccessTokenLogout(r *http.Request, claims *auth.Claims, loggedOutAt time.Time) error {
	subjectID := authSubjectID(claims)
	if subjectID == 0 {
		return nil
	}

	var organisationID *int64
	var membershipID *int64
	if claims.ActorType == "account" {
		organisationID = int64Ptr(claims.OrganisationID)
		membershipID = int64Ptr(claims.MembershipID)
	}
	return a.Repo.RecordAccessTokenLogout(r.Context(), claims.ActorType, subjectID, organisationID, membershipID, loggedOutAt)
}

func (a *App) authMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "missing authentication")
		return
	}
	httpx.JSON(w, http.StatusOK, dto.AuthMeFromClaims(claims))
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

	httpx.JSON(w, http.StatusOK, map[string]any{"workspaces": dto.WorkspacesFromModels(workspaces)})
}

func (a *App) switchOrganisation(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" {
		httpx.Error(w, http.StatusForbidden, "account token required")
		return
	}

	var input dto.SwitchOrganisationRequest
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
	http.SetCookie(w, a.accessCookie(accountAccessCookieName, token))

	httpx.JSON(w, http.StatusOK, dto.LoginResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		Workspace:   dto.WorkspaceFromModel(workspace),
	})
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

func (a *App) accessCookie(name, value string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     a.Config.APIBasePath,
		Domain:   a.Config.RefreshCookieDomain,
		Expires:  time.Now().UTC().Add(a.Config.AccessTokenTTL),
		MaxAge:   int(a.Config.AccessTokenTTL.Seconds()),
		HttpOnly: true,
		Secure:   a.Config.RefreshCookieSecure,
		SameSite: http.SameSiteLaxMode,
	}
}

func (a *App) expiredAccessCookie(name string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     a.Config.APIBasePath,
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
