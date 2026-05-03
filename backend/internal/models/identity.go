package models

import "time"

type Admin struct {
	ID           int64
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	Status       string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Account struct {
	ID           int64
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	Phone        *string
	Status       string
	LastLoginAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}

type OrganisationMembership struct {
	ID                    int64
	OrganisationID        int64
	AccountID             int64
	EmployeeCategoryID    *int64
	DisplayName           *string
	JobTitle              *string
	Status                string
	InvitedByMembershipID *int64
	InvitedAt             *time.Time
	JoinedAt              *time.Time
	CreatedAt             time.Time
	UpdatedAt             time.Time
	DeletedAt             *time.Time
}

type AccountWorkspace struct {
	MembershipID   int64
	OrganisationID int64
	Organisation   string
	DisplayName    *string
	JobTitle       *string
}

type Role struct {
	ID             int64
	OrganisationID int64
	Slug           string
	Name           string
	SystemRole     bool
	CreatedAt      time.Time
}

type Permission struct {
	ID          int64
	Slug        string
	Description *string
}

type RefreshSession struct {
	ID                   int64
	JTI                  string
	ActorType            string
	SubjectID            int64
	ActiveOrganisationID *int64
	ActiveMembershipID   *int64
	ExpiresAt            time.Time
	RevokedAt            *time.Time
	CreatedAt            time.Time
}
