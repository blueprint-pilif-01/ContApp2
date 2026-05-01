package models

import "time"

type Admin struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Account struct {
	ID           int64      `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	FirstName    string     `json:"first_name"`
	LastName     string     `json:"last_name"`
	Phone        *string    `json:"phone,omitempty"`
	Status       string     `json:"status"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
}

type OrganisationMembership struct {
	ID                    int64      `json:"id"`
	OrganisationID        int64      `json:"organisation_id"`
	AccountID             int64      `json:"account_id"`
	EmployeeCategoryID    *int64     `json:"employee_category_id,omitempty"`
	DisplayName           *string    `json:"display_name,omitempty"`
	JobTitle              *string    `json:"job_title,omitempty"`
	Status                string     `json:"status"`
	InvitedByMembershipID *int64     `json:"invited_by_membership_id,omitempty"`
	InvitedAt             *time.Time `json:"invited_at,omitempty"`
	JoinedAt              *time.Time `json:"joined_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	DeletedAt             *time.Time `json:"deleted_at,omitempty"`
}

type AccountWorkspace struct {
	MembershipID   int64   `json:"membership_id"`
	OrganisationID int64   `json:"organisation_id"`
	Organisation   string  `json:"organisation"`
	DisplayName    *string `json:"display_name,omitempty"`
	JobTitle       *string `json:"job_title,omitempty"`
}

type Role struct {
	ID             int64     `json:"id"`
	OrganisationID int64     `json:"organisation_id"`
	Slug           string    `json:"slug"`
	Name           string    `json:"name"`
	SystemRole     bool      `json:"system_role"`
	CreatedAt      time.Time `json:"created_at"`
}

type Permission struct {
	ID          int64   `json:"id"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
}

type RefreshSession struct {
	ID                   int64      `json:"id"`
	JTI                  string     `json:"jti"`
	ActorType            string     `json:"actor_type"`
	SubjectID            int64      `json:"subject_id"`
	ActiveOrganisationID *int64     `json:"active_organisation_id,omitempty"`
	ActiveMembershipID   *int64     `json:"active_membership_id,omitempty"`
	ExpiresAt            time.Time  `json:"expires_at"`
	RevokedAt            *time.Time `json:"revoked_at,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
}
