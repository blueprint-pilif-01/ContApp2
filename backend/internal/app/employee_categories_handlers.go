package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listEmployeeCategories(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	categories, err := a.Repo.ListEmployeeCategories(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list employee categories")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"employee_categories": categories})
}

func (a *App) createEmployeeCategory(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var category models.EmployeeCategory
	if err := httpx.DecodeJSON(r, &category); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if category.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	category.OrganisationID = claims.OrganisationID
	if err := a.Repo.CreateEmployeeCategory(r.Context(), &category); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create employee category")
		return
	}
	httpx.JSON(w, http.StatusCreated, category)
}

func (a *App) updateEmployeeCategory(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var category models.EmployeeCategory
	if err := httpx.DecodeJSON(r, &category); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if category.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	category.ID = id
	category.OrganisationID = claims.OrganisationID
	if err := a.Repo.UpdateEmployeeCategory(r.Context(), &category); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update employee category")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) deleteEmployeeCategory(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteEmployeeCategory(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete employee category")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
