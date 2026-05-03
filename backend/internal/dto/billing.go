package dto

import (
	"backend/internal/models"
	"time"
)

type SubscriptionResponse struct {
	ID                   int64      `json:"id"`
	OrganisationID       int64      `json:"organisation_id"`
	SubscriptionPlanID   int64      `json:"subscription_plan_id"`
	Status               string     `json:"status"`
	StripeSubscriptionID *string    `json:"stripe_subscription_id,omitempty"`
	CurrentPeriodStart   *time.Time `json:"current_period_start,omitempty"`
	CurrentPeriodEnd     *time.Time `json:"current_period_end,omitempty"`
	CancelAtPeriodEnd    bool       `json:"cancel_at_period_end"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type OrganisationFeatureResponse struct {
	OrganisationID      int64        `json:"organisation_id"`
	FeatureDefinitionID int64        `json:"feature_definition_id"`
	FeatureKey          string       `json:"feature_key"`
	Enabled             bool         `json:"enabled"`
	Source              string       `json:"source"`
	StartsAt            *time.Time   `json:"starts_at,omitempty"`
	ExpiresAt           *time.Time   `json:"expires_at,omitempty"`
	ConfigJSON          models.JSONB `json:"config_json"`
	CreatedAt           time.Time    `json:"created_at"`
	UpdatedAt           time.Time    `json:"updated_at"`
}

type OrganisationFeatureLimitResponse struct {
	OrganisationID      int64     `json:"organisation_id"`
	FeatureDefinitionID int64     `json:"feature_definition_id"`
	FeatureKey          string    `json:"feature_key"`
	LimitKey            string    `json:"limit_key"`
	LimitValue          int64     `json:"limit_value"`
	Period              string    `json:"period"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func SubscriptionFromModel(subscription models.Subscription) SubscriptionResponse {
	return SubscriptionResponse(subscription)
}

func SubscriptionsFromModels(subscriptions []models.Subscription) []SubscriptionResponse {
	out := make([]SubscriptionResponse, 0, len(subscriptions))
	for _, subscription := range subscriptions {
		out = append(out, SubscriptionFromModel(subscription))
	}
	return out
}

func OrganisationFeatureFromModel(feature models.OrganisationFeature) OrganisationFeatureResponse {
	return OrganisationFeatureResponse(feature)
}

func OrganisationFeaturesFromModels(features []models.OrganisationFeature) []OrganisationFeatureResponse {
	out := make([]OrganisationFeatureResponse, 0, len(features))
	for _, feature := range features {
		out = append(out, OrganisationFeatureFromModel(feature))
	}
	return out
}

func OrganisationFeatureLimitFromModel(limit models.OrganisationFeatureLimit) OrganisationFeatureLimitResponse {
	return OrganisationFeatureLimitResponse(limit)
}

func OrganisationFeatureLimitsFromModels(limits []models.OrganisationFeatureLimit) []OrganisationFeatureLimitResponse {
	out := make([]OrganisationFeatureLimitResponse, 0, len(limits))
	for _, limit := range limits {
		out = append(out, OrganisationFeatureLimitFromModel(limit))
	}
	return out
}
