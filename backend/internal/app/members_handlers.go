package app

import (
	"backend/internal/dto"
	"backend/internal/models"
	"backend/internal/platform/auth"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listMembers(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	members, err := a.Repo.ListWorkspaceMembers(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list members")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"members": dto.WorkspaceMembersFromModels(members)})
}

func (a *App) createMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input dto.CreateMemberRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if input.Email == "" || input.Password == "" || input.FirstName == "" || input.LastName == "" {
		httpx.Error(w, http.StatusBadRequest, "email, password, first_name, and last_name are required")
		return
	}
	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not hash password")
		return
	}
	member := models.WorkspaceMember{
		OrganisationID:     claims.OrganisationID,
		Email:              input.Email,
		FirstName:          input.FirstName,
		LastName:           input.LastName,
		Phone:              input.Phone,
		EmployeeCategoryID: input.EmployeeCategoryID,
		DisplayName:        input.DisplayName,
		JobTitle:           input.JobTitle,
		Status:             input.Status,
	}
	if err := a.Repo.CreateWorkspaceMember(r.Context(), &member, passwordHash); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create member")
		return
	}
	httpx.JSON(w, http.StatusCreated, dto.WorkspaceMemberFromModel(member))
}

func (a *App) getMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	member, err := a.Repo.GetWorkspaceMember(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "member not found")
		return
	}
	httpx.JSON(w, http.StatusOK, dto.WorkspaceMemberFromModel(*member))
}

func (a *App) updateMember(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input dto.UpdateMemberRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	member := models.WorkspaceMember{
		MembershipID:       id,
		OrganisationID:     claims.OrganisationID,
		Email:              input.Email,
		FirstName:          input.FirstName,
		LastName:           input.LastName,
		Phone:              input.Phone,
		EmployeeCategoryID: input.EmployeeCategoryID,
		DisplayName:        input.DisplayName,
		JobTitle:           input.JobTitle,
		Status:             input.Status,
	}
	if err := a.Repo.UpdateWorkspaceMember(r.Context(), &member); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update member")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) updateMemberStatus(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input dto.StatusRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || input.Status == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := a.Repo.UpdateWorkspaceMemberStatus(r.Context(), claims.OrganisationID, id, input.Status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update member status")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) setMemberRoles(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input dto.SetRolesRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := a.Repo.SetMembershipRoles(r.Context(), claims.OrganisationID, id, input.RoleIDs); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not set member roles")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) listRoles(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	roles, err := a.Repo.ListRoles(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list roles")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"roles": dto.RolesFromModels(roles)})
}

func (a *App) listPermissions(w http.ResponseWriter, r *http.Request) {
	permissions, err := a.Repo.ListPermissions(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list permissions")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"permissions": dto.PermissionsFromModels(permissions)})
}
