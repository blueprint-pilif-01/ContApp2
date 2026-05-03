package dto

type CreateMemberRequest struct {
	Email              string  `json:"email"`
	Password           string  `json:"password"`
	FirstName          string  `json:"first_name"`
	LastName           string  `json:"last_name"`
	Phone              *string `json:"phone"`
	EmployeeCategoryID *int64  `json:"employee_category_id"`
	DisplayName        *string `json:"display_name"`
	JobTitle           *string `json:"job_title"`
	Status             string  `json:"status"`
}

type UpdateMemberRequest struct {
	Email              string  `json:"email"`
	FirstName          string  `json:"first_name"`
	LastName           string  `json:"last_name"`
	Phone              *string `json:"phone"`
	EmployeeCategoryID *int64  `json:"employee_category_id"`
	DisplayName        *string `json:"display_name"`
	JobTitle           *string `json:"job_title"`
	Status             string  `json:"status"`
}

type SetRolesRequest struct {
	RoleIDs []int64 `json:"role_ids"`
}
