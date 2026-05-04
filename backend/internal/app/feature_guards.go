package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
	"time"
)

func (a *App) requireFeature(featureKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := claimsFromContext(r.Context())
			if !ok {
				httpx.Error(w, http.StatusUnauthorized, "missing authentication")
				return
			}

			if claims.ActorType != "account" || claims.OrganisationID == 0 {
				a.Logger.Warn("feature guard rejected", "reason", "missing_organisation_scope", "actor_type", claims.ActorType, "feature", featureKey, "path", r.URL.Path, "method", r.Method)
				httpx.Error(w, http.StatusForbidden, "account workspace token required")
				return
			}

			features, err := a.Repo.ListOrganisationFeatures(r.Context(), claims.OrganisationID)
			if err != nil {
				a.Logger.Error("feature guard failed", "reason", "feature_lookup_failed", "organisation_id", claims.OrganisationID, "feature", featureKey, "error", err)
				httpx.Error(w, http.StatusInternalServerError, "could not load organisation features")
				return
			}

			if !featureEnabled(features, featureKey, time.Now().UTC()) {
				a.Logger.Warn("feature guard rejected", "reason", "feature_not_enabled", "organisation_id", claims.OrganisationID, "membership_id", claims.MembershipID, "feature", featureKey, "path", r.URL.Path, "method", r.Method)
				httpx.Error(w, http.StatusForbidden, "feature not enabled")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func featureEnabled(features []models.OrganisationFeature, featureKey string, now time.Time) bool {
	for _, feature := range features {
		if feature.FeatureKey != featureKey || !feature.Enabled {
			continue
		}
		if feature.StartsAt != nil && now.Before(feature.StartsAt.UTC()) {
			continue
		}
		if feature.ExpiresAt != nil && !now.Before(feature.ExpiresAt.UTC()) {
			continue
		}
		return true
	}
	return false
}
