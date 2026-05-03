package models

import "time"

type Organisation struct {
	ID        int64
	Name      string
	CUI       *string
	Address   *string
	Status    string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

type OrganisationSettings struct {
	OrganisationID int64
	Settings       JSONB
	UpdatedAt      time.Time
}

type EmployeeCategory struct {
	ID             int64
	OrganisationID int64
	Name           string
	Description    *string
	Color          *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}

type WorkspaceMember struct {
	MembershipID       int64
	OrganisationID     int64
	AccountID          int64
	Email              string
	FirstName          string
	LastName           string
	Phone              *string
	EmployeeCategoryID *int64
	EmployeeCategory   *string
	DisplayName        *string
	JobTitle           *string
	Status             string
	Roles              []Role
	JoinedAt           *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}
