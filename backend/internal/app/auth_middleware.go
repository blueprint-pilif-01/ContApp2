package app

import (
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"context"
	"net/http"
	"strings"
)

type authContextKey string

const claimsContextKey authContextKey = "claims"

func (a *App) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := a.accessTokenFromRequest(r)
		if token == "" {
			a.Logger.Warn("auth rejected", "reason", "missing_bearer_token", "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			httpx.Error(w, http.StatusUnauthorized, "missing bearer token")
			return
		}

		claims, err := a.Tokens.Parse(token)
		if err != nil {
			a.Logger.Warn("auth rejected", "reason", "invalid_bearer_token", "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr, "token_length", len(token), "error", err)
			httpx.Error(w, http.StatusUnauthorized, "invalid bearer token")
			return
		}
		if claims.TokenUse != "access" {
			a.Logger.Warn("auth rejected", "reason", "wrong_token_use", "token_use", claims.TokenUse, "actor_type", claims.ActorType, "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			httpx.Error(w, http.StatusUnauthorized, "access token required")
			return
		}
		if claims.IssuedAt == nil {
			a.Logger.Warn("auth rejected", "reason", "missing_issued_at", "actor_type", claims.ActorType, "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			httpx.Error(w, http.StatusUnauthorized, "invalid bearer token")
			return
		}
		subjectID := authSubjectID(claims)
		if subjectID == 0 {
			a.Logger.Warn("auth rejected", "reason", "missing_subject", "actor_type", claims.ActorType, "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			httpx.Error(w, http.StatusUnauthorized, "invalid bearer token")
			return
		}
		loggedOut, err := a.Repo.IsAccessTokenLoggedOut(r.Context(), claims.ActorType, subjectID, claims.IssuedAt.Time)
		if err != nil {
			a.Logger.Error("auth failed", "reason", "logout_check_failed", "actor_type", claims.ActorType, "subject_id", subjectID, "method", r.Method, "path", r.URL.Path, "error", err)
			httpx.Error(w, http.StatusInternalServerError, "could not validate token")
			return
		}
		if loggedOut {
			a.Logger.Warn("auth rejected", "reason", "token_logged_out", "actor_type", claims.ActorType, "subject_id", subjectID, "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
			httpx.Error(w, http.StatusUnauthorized, "token revoked")
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *App) requireAccount(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := claimsFromContext(r.Context())
		if !ok {
			httpx.Error(w, http.StatusUnauthorized, "missing authentication")
			return
		}
		if claims.ActorType != "account" || claims.AccountID == 0 || claims.OrganisationID == 0 || claims.MembershipID == 0 {
			a.Logger.Warn("auth rejected", "reason", "account_workspace_token_required", "actor_type", claims.ActorType, "path", r.URL.Path, "method", r.Method)
			httpx.Error(w, http.StatusForbidden, "account workspace token required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *App) accessTokenFromRequest(r *http.Request) string {
	if token := bearerToken(r); token != "" {
		return token
	}
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		return ""
	}
	if strings.HasPrefix(r.URL.Path, a.Config.APIBasePath+"/admin/") {
		if cookie, err := r.Cookie(adminAccessCookieName); err == nil && cookie.Value != "" {
			return cookie.Value
		}
		if cookie, err := r.Cookie(accountAccessCookieName); err == nil && cookie.Value != "" {
			return cookie.Value
		}
		return ""
	}
	if cookie, err := r.Cookie(accountAccessCookieName); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	if cookie, err := r.Cookie(adminAccessCookieName); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	return ""
}

func authSubjectID(claims *auth.Claims) int64 {
	switch claims.ActorType {
	case "admin":
		return claims.AdminID
	case "account":
		return claims.AccountID
	default:
		return 0
	}
}

func claimsFromContext(ctx context.Context) (*auth.Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*auth.Claims)
	return claims, ok
}
