package models

import "time"

type SubscriptionPlan struct {
	ID            int64
	Slug          string
	Name          string
	PlanKind      string
	PriceCents    int
	Currency      string
	StripePriceID *string
	LimitsJSON    JSONB
	FeaturesJSON  JSONB
	Active        bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type FeatureDefinition struct {
	ID                int64
	FeatureKey        string
	Name              string
	PackageName       string
	Category          string
	Description       *string
	DefaultLimitsJSON JSONB
	Active            bool
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type Subscription struct {
	ID                   int64
	OrganisationID       int64
	SubscriptionPlanID   int64
	Status               string
	StripeSubscriptionID *string
	CurrentPeriodStart   *time.Time
	CurrentPeriodEnd     *time.Time
	CancelAtPeriodEnd    bool
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

type OrganisationFeature struct {
	OrganisationID      int64
	FeatureDefinitionID int64
	FeatureKey          string
	Enabled             bool
	Source              string
	StartsAt            *time.Time
	ExpiresAt           *time.Time
	ConfigJSON          JSONB
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type OrganisationFeatureLimit struct {
	OrganisationID      int64
	FeatureDefinitionID int64
	FeatureKey          string
	LimitKey            string
	LimitValue          int64
	Period              string
	UpdatedAt           time.Time
}
