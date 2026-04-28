package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listTicketingTasks(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	tasks, err := a.Repo.ListTicketingTasks(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list ticketing tasks")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

func (a *App) createTicketingTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var task models.TicketingTask
	if err := httpx.DecodeJSON(r, &task); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	task.OrganisationID = claims.OrganisationID
	task.CreatedByID = claims.MembershipID
	if err := a.Repo.CreateTicketingTask(r.Context(), &task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create ticketing task")
		return
	}
	httpx.JSON(w, http.StatusCreated, task)
}

func (a *App) getTicketingTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	task, err := a.Repo.GetTicketingTask(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "ticketing task not found")
		return
	}
	httpx.JSON(w, http.StatusOK, task)
}

func (a *App) updateTicketingTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var task models.TicketingTask
	if err := httpx.DecodeJSON(r, &task); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	task.ID = id
	task.OrganisationID = claims.OrganisationID
	if err := a.Repo.UpdateTicketingTask(r.Context(), &task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update ticketing task")
		return
	}
	httpx.JSON(w, http.StatusOK, task)
}

func (a *App) deleteTicketingTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteTicketingTask(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete ticketing task")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
