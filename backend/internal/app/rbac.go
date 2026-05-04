package app

import (
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) requirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := claimsFromContext(r.Context())
			if !ok {
				httpx.Error(w, http.StatusUnauthorized, "missing authentication")
				return
			}

			if claims.ActorType != "account" || claims.OrganisationID == 0 || claims.MembershipID == 0 {
				a.Logger.Warn("rbac rejected", "reason", "missing_workspace_scope", "actor_type", claims.ActorType, "path", r.URL.Path, "method", r.Method)
				httpx.Error(w, http.StatusForbidden, "account workspace token required")
				return
			}

			permissions, err := a.Repo.ListPermissionsForMembership(r.Context(), claims.OrganisationID, claims.MembershipID)
			if err != nil {
				a.Logger.Error("rbac failed", "reason", "permission_lookup_failed", "organisation_id", claims.OrganisationID, "membership_id", claims.MembershipID, "permission", permission, "error", err)
				httpx.Error(w, http.StatusInternalServerError, "could not load permissions")
				return
			}

			if !hasPermission(permissions, permission) {
				a.Logger.Warn("rbac rejected", "reason", "permission_denied", "organisation_id", claims.OrganisationID, "membership_id", claims.MembershipID, "permission", permission, "path", r.URL.Path, "method", r.Method)
				httpx.Error(w, http.StatusForbidden, "permission denied")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func hasPermission(permissions []string, required string) bool {
	for _, permission := range permissions {
		if permission == required {
			return true
		}
	}
	return false
}
