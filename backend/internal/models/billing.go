package models

import "time"

type SubscriptionPlan struct {
	ID            int64     `json:"id"`
	Slug          string    `json:"slug"`
	Name          string    `json:"name"`
	PlanKind      string    `json:"plan_kind"`
	PriceCents    int       `json:"price_cents"`
	Currency      string    `json:"currency"`
	StripePriceID *string   `json:"stripe_price_id,omitempty"`
	LimitsJSON    JSONB     `json:"limits_json"`
	FeaturesJSON  JSONB     `json:"features_json"`
	Active        bool      `json:"active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type FeatureDefinition struct {
	ID                int64     `json:"id"`
	FeatureKey        string    `json:"feature_key"`
	Name              string    `json:"name"`
	PackageName       string    `json:"package_name"`
	Category          string    `json:"category"`
	Description       *string   `json:"description,omitempty"`
	DefaultLimitsJSON JSONB     `json:"default_limits_json"`
	Active            bool      `json:"active"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Subscription struct {
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

type OrganisationFeature struct {
	OrganisationID      int64      `json:"organisation_id"`
	FeatureDefinitionID int64      `json:"feature_definition_id"`
	FeatureKey          string     `json:"feature_key"`
	Enabled             bool       `json:"enabled"`
	Source              string     `json:"source"`
	StartsAt            *time.Time `json:"starts_at,omitempty"`
	ExpiresAt           *time.Time `json:"expires_at,omitempty"`
	ConfigJSON          JSONB      `json:"config_json"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type OrganisationFeatureLimit struct {
	OrganisationID      int64     `json:"organisation_id"`
	FeatureDefinitionID int64     `json:"feature_definition_id"`
	FeatureKey          string    `json:"feature_key"`
	LimitKey            string    `json:"limit_key"`
	LimitValue          int64     `json:"limit_value"`
	Period              string    `json:"period"`
	UpdatedAt           time.Time `json:"updated_at"`
}
