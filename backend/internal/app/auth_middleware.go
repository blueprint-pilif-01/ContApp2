package app

import (
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"context"
	"net/http"
)

type authContextKey string

const claimsContextKey authContextKey = "claims"

func (a *App) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r)
		if token == "" {
			httpx.Error(w, http.StatusUnauthorized, "missing bearer token")
			return
		}

		claims, err := a.Tokens.Parse(token)
		if err != nil {
			httpx.Error(w, http.StatusUnauthorized, "invalid bearer token")
			return
		}
		if claims.TokenUse != "access" {
			httpx.Error(w, http.StatusUnauthorized, "access token required")
			return
		}

		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func claimsFromContext(ctx context.Context) (*auth.Claims, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*auth.Claims)
	return claims, ok
}

func (a *App) requirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := claimsFromContext(r.Context())
			if !ok {
				httpx.Error(w, http.StatusUnauthorized, "missing authentication")
				return
			}
			if claims.ActorType == "admin" {
				next.ServeHTTP(w, r)
				return
			}
			if claims.ActorType != "account" || claims.OrganisationID == 0 || claims.MembershipID == 0 {
				httpx.Error(w, http.StatusForbidden, "account workspace token required")
				return
			}

			permissions, err := a.Repo.ListPermissionsForMembership(r.Context(), claims.OrganisationID, claims.MembershipID)
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "could not load permissions")
				return
			}
			if !hasPermission(permissions, permission) {
				httpx.Error(w, http.StatusForbidden, "permission denied")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
