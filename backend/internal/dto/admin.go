package dto

import (
	"backend/internal/models"
	"strings"
	"time"
)

type AdminUserRequest struct {
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Type           string `json:"type"`
	Status         string `json:"status"`
	OrganisationID int64  `json:"organisation_id"`
	Title          string `json:"title"`
	Password       string `json:"password"`
}

func (r *AdminUserRequest) Normalize() {
	r.FirstName = strings.TrimSpace(r.FirstName)
	r.LastName = strings.TrimSpace(r.LastName)
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	r.Phone = strings.TrimSpace(r.Phone)
	r.Type = strings.TrimSpace(r.Type)
	r.Status = strings.TrimSpace(r.Status)
	r.Title = strings.TrimSpace(r.Title)
}

type AdminUserResponse struct {
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	Status         string     `json:"status"`
	Type           string     `json:"type,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	Title          *string    `json:"title,omitempty"`
	OrganisationID *int64     `json:"organisation_id,omitempty"`
	DateAdded      *time.Time `json:"date_added,omitempty"`
}

type AdminOrganisationRequest struct {
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	ContactEmail string `json:"contact_email"`
	CUI          any    `json:"cui"`
	Address      string `json:"address"`
	Status       string `json:"status"`
	Plan         string `json:"plan"`
	Employees    int    `json:"employees"`
	Country      string `json:"country"`
}

func (r *AdminOrganisationRequest) Normalize() {
	r.Name = strings.TrimSpace(r.Name)
	r.Slug = strings.TrimSpace(r.Slug)
	r.ContactEmail = strings.TrimSpace(r.ContactEmail)
	r.Address = strings.TrimSpace(r.Address)
	r.Status = strings.TrimSpace(r.Status)
	r.Plan = strings.TrimSpace(r.Plan)
	r.Country = strings.TrimSpace(r.Country)
}

type AdminOrganisationResponse struct {
	ID           int64      `json:"id"`
	Name         string     `json:"name"`
	Slug         string     `json:"slug"`
	Status       string     `json:"status"`
	Plan         string     `json:"plan"`
	Employees    int        `json:"employees"`
	CreatedAt    time.Time  `json:"created_at"`
	ContactEmail string     `json:"contact_email"`
	CUI          *string    `json:"cui,omitempty"`
	Address      *string    `json:"address,omitempty"`
	Country      string     `json:"country"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
}

type StatusRequest struct {
	Status string `json:"status"`
}

func NewAdminOrganisationResponse(organisation models.Organisation, input AdminOrganisationRequest) AdminOrganisationResponse {
	input.Normalize()
	slug := input.Slug
	if slug == "" {
		slug = OrganisationSlug(organisation.Name)
	}
	return AdminOrganisationResponse{
		ID:           organisation.ID,
		Name:         organisation.Name,
		Slug:         slug,
		Status:       organisation.Status,
		Plan:         defaultString(input.Plan, "Free"),
		Employees:    input.Employees,
		CreatedAt:    organisation.CreatedAt,
		ContactEmail: input.ContactEmail,
		CUI:          organisation.CUI,
		Address:      organisation.Address,
		Country:      defaultString(input.Country, "RO"),
		UpdatedAt:    organisation.UpdatedAt,
		DeletedAt:    organisation.DeletedAt,
	}
}

func OrganisationSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = strings.NewReplacer(" ", "-", "_", "-", ".", "-", "/", "-").Replace(slug)
	slug = strings.Trim(slug, "-")
	if slug == "" {
		return "organisation"
	}
	return slug
}

func AdminOrganisationStatus(status string) string {
	switch strings.TrimSpace(status) {
	case "suspended":
		return "suspended"
	case "deleted":
		return "deleted"
	default:
		return "active"
	}
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}
