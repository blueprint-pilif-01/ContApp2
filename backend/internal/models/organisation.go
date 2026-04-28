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
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}
