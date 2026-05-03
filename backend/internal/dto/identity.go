package dto

import (
	"backend/internal/models"
	"time"
)

type WorkspaceMemberResponse struct {
	MembershipID       int64          `json:"membership_id"`
	OrganisationID     int64          `json:"organisation_id"`
	AccountID          int64          `json:"account_id"`
	Email              string         `json:"email"`
	FirstName          string         `json:"first_name"`
	LastName           string         `json:"last_name"`
	Phone              *string        `json:"phone,omitempty"`
	EmployeeCategoryID *int64         `json:"employee_category_id,omitempty"`
	EmployeeCategory   *string        `json:"employee_category,omitempty"`
	DisplayName        *string        `json:"display_name,omitempty"`
	JobTitle           *string        `json:"job_title,omitempty"`
	Status             string         `json:"status"`
	Roles              []RoleResponse `json:"roles,omitempty"`
	JoinedAt           *time.Time     `json:"joined_at,omitempty"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
}

type RoleResponse struct {
	ID             int64     `json:"id"`
	OrganisationID int64     `json:"organisation_id"`
	Slug           string    `json:"slug"`
	Name           string    `json:"name"`
	SystemRole     bool      `json:"system_role"`
	CreatedAt      time.Time `json:"created_at"`
}

type PermissionResponse struct {
	ID          int64   `json:"id"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
}

func WorkspaceMemberFromModel(member models.WorkspaceMember) WorkspaceMemberResponse {
	return WorkspaceMemberResponse{
		MembershipID:       member.MembershipID,
		OrganisationID:     member.OrganisationID,
		AccountID:          member.AccountID,
		Email:              member.Email,
		FirstName:          member.FirstName,
		LastName:           member.LastName,
		Phone:              member.Phone,
		EmployeeCategoryID: member.EmployeeCategoryID,
		EmployeeCategory:   member.EmployeeCategory,
		DisplayName:        member.DisplayName,
		JobTitle:           member.JobTitle,
		Status:             member.Status,
		Roles:              RolesFromModels(member.Roles),
		JoinedAt:           member.JoinedAt,
		CreatedAt:          member.CreatedAt,
		UpdatedAt:          member.UpdatedAt,
	}
}

func WorkspaceMembersFromModels(members []models.WorkspaceMember) []WorkspaceMemberResponse {
	out := make([]WorkspaceMemberResponse, 0, len(members))
	for _, member := range members {
		out = append(out, WorkspaceMemberFromModel(member))
	}
	return out
}

func RoleFromModel(role models.Role) RoleResponse {
	return RoleResponse(role)
}

func RolesFromModels(roles []models.Role) []RoleResponse {
	out := make([]RoleResponse, 0, len(roles))
	for _, role := range roles {
		out = append(out, RoleFromModel(role))
	}
	return out
}

func PermissionFromModel(permission models.Permission) PermissionResponse {
	return PermissionResponse(permission)
}

func PermissionsFromModels(permissions []models.Permission) []PermissionResponse {
	out := make([]PermissionResponse, 0, len(permissions))
	for _, permission := range permissions {
		out = append(out, PermissionFromModel(permission))
	}
	return out
}
