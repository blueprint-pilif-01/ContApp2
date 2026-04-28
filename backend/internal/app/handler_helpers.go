package app

import (
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

func pathID(r *http.Request, key string) (int64, error) {
	raw := chi.URLParam(r, key)
	if raw == "" {
		return 0, errors.New("missing path id")
	}
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid path id")
	}
	return id, nil
}

func accountClaims(w http.ResponseWriter, r *http.Request) (*auth.Claims, bool) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" || claims.OrganisationID == 0 || claims.MembershipID == 0 {
		httpx.Error(w, http.StatusForbidden, "account workspace token required")
		return nil, false
	}
	return claims, true
}

func hasPermission(permissions []string, required string) bool {
	for _, permission := range permissions {
		if permission == required {
			return true
		}
	}
	return false
}
