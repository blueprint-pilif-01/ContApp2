package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
	"strconv"
	"time"
)

type currentExtensionsResponse struct {
	Extensions map[string]bool `json:"extensions"`
}

type currentSubscriptionResponse struct {
	ID                string          `json:"id"`
	Plan              string          `json:"plan"`
	Status            string          `json:"status"`
	PeriodEnd         string          `json:"period_end"`
	CancelAtPeriodEnd bool            `json:"cancel_at_period_end"`
	Extensions        map[string]bool `json:"extensions"`
	Limits            map[string]any  `json:"limits"`
	Usage             map[string]int  `json:"usage"`
}

func (a *App) getCurrentOrganisationExtensions(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" || claims.OrganisationID == 0 {
		httpx.Error(w, http.StatusForbidden, "workspace token required")
		return
	}

	features, err := a.Repo.ListOrganisationFeatures(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load organisation extensions")
		return
	}
	httpx.JSON(w, http.StatusOK, currentExtensionsResponse{
		Extensions: frontendExtensionsFromFeatures(features),
	})
}

func (a *App) getCurrentOrganisationSubscription(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r.Context())
	if !ok || claims.ActorType != "account" || claims.OrganisationID == 0 {
		httpx.Error(w, http.StatusForbidden, "workspace token required")
		return
	}

	features, err := a.Repo.ListOrganisationFeatures(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load organisation extensions")
		return
	}
	subscriptions, err := a.Repo.ListOrganisationSubscriptions(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load organisation subscription")
		return
	}

	id := "free"
	status := "active"
	periodEnd := time.Now().AddDate(0, 1, 0)
	cancelAtPeriodEnd := false
	if len(subscriptions) > 0 {
		subscription := subscriptions[0]
		id = strconv.FormatInt(subscription.ID, 10)
		status = subscription.Status
		cancelAtPeriodEnd = subscription.CancelAtPeriodEnd
		if subscription.CurrentPeriodEnd != nil {
			periodEnd = *subscription.CurrentPeriodEnd
		}
	}

	httpx.JSON(w, http.StatusOK, currentSubscriptionResponse{
		ID:                id,
		Plan:              "Free",
		Status:            status,
		PeriodEnd:         periodEnd.Format(time.RFC3339),
		CancelAtPeriodEnd: cancelAtPeriodEnd,
		Extensions:        frontendExtensionsFromFeatures(features),
		Limits: map[string]any{
			"templates":          nil,
			"signings_per_month": nil,
			"clients":            nil,
			"storage_mb":         nil,
		},
		Usage: map[string]int{
			"templates":           0,
			"signings_this_month": 0,
			"clients":             0,
			"storage_mb":          0,
		},
	})
}

func frontendExtensionsFromFeatures(features []models.OrganisationFeature) map[string]bool {
	now := time.Now()
	return map[string]bool{
		"contracts_pro":       featureEnabled(features, FeatureContracts, now),
		"ticketing_pro":       featureEnabled(features, FeatureTicketing, now),
		"hr_pro":              featureEnabled(features, FeatureHR, now),
		"internal_chat":       featureEnabled(features, FeatureInternalChat, now),
		"legislation_monitor": featureEnabled(features, "legislation_monitor", now),
		"ai_assistant":        featureEnabled(features, "ai_assistant", now),
		"multi_site_teams":    featureEnabled(features, "multi_site_teams", now),
	}
}
