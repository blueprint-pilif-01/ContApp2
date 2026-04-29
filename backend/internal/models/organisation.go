package models

import "time"

type Organisation struct {
	ID        int64      `json:"id"`
	Name      string     `json:"name"`
	CUI       *string    `json:"cui,omitempty"`
	Address   *string    `json:"address,omitempty"`
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type OrganisationSettings struct {
	OrganisationID int64     `json:"organisation_id"`
	Settings       JSONB     `json:"settings"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type EmployeeCategory struct {
	ID             int64      `json:"id"`
	OrganisationID int64      `json:"organisation_id"`
	Name           string     `json:"name"`
	Description    *string    `json:"description,omitempty"`
	Color          *string    `json:"color,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

type WorkspaceMember struct {
	MembershipID       int64      `json:"membership_id"`
	OrganisationID     int64      `json:"organisation_id"`
	AccountID          int64      `json:"account_id"`
	Email              string     `json:"email"`
	FirstName          string     `json:"first_name"`
	LastName           string     `json:"last_name"`
	Phone              *string    `json:"phone,omitempty"`
	EmployeeCategoryID *int64     `json:"employee_category_id,omitempty"`
	EmployeeCategory   *string    `json:"employee_category,omitempty"`
	DisplayName        *string    `json:"display_name,omitempty"`
	JobTitle           *string    `json:"job_title,omitempty"`
	Status             string     `json:"status"`
	Roles              []Role     `json:"roles,omitempty"`
	JoinedAt           *time.Time `json:"joined_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}
