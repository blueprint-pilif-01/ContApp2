package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
	"time"
)

type ticketingTaskRequest struct {
	models.TicketingTask
	AssigneeID *int64     `json:"assignee_id"`
	OwnerID    *int64     `json:"owner_id"`
	DueDate    *time.Time `json:"due_date"`
}

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
	response := make([]map[string]any, 0, len(tasks))
	for _, task := range tasks {
		response = append(response, ticketingTaskResponse(task))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"tasks": response})
}

func (a *App) createTicketingTask(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input ticketingTaskRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	task := ticketingTaskFromRequest(input)
	task.OrganisationID = claims.OrganisationID
	task.CreatedByID = claims.MembershipID
	normalizeTicketingTask(&task)
	if err := a.Repo.CreateTicketingTask(r.Context(), &task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create ticketing task")
		return
	}
	httpx.JSON(w, http.StatusCreated, ticketingTaskResponse(task))
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
	httpx.JSON(w, http.StatusOK, ticketingTaskResponse(*task))
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
	var input ticketingTaskRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	task := ticketingTaskFromRequest(input)
	task.ID = id
	task.OrganisationID = claims.OrganisationID
	normalizeTicketingTask(&task)
	if err := a.Repo.UpdateTicketingTask(r.Context(), &task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update ticketing task")
		return
	}
	updated, err := a.Repo.GetTicketingTask(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.JSON(w, http.StatusOK, ticketingTaskResponse(task))
		return
	}
	httpx.JSON(w, http.StatusOK, ticketingTaskResponse(*updated))
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

func (a *App) claimTicketingTask(w http.ResponseWriter, r *http.Request) {
	a.updateTicketingTaskAction(w, r, "in_progress")
}

func (a *App) completeTicketingTask(w http.ResponseWriter, r *http.Request) {
	a.updateTicketingTaskAction(w, r, "done")
}

func (a *App) refuseTicketingTask(w http.ResponseWriter, r *http.Request) {
	a.updateTicketingTaskAction(w, r, "blocked")
}

func (a *App) updateTicketingTaskAction(w http.ResponseWriter, r *http.Request, status string) {
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
	task.Status = status
	if status == "in_progress" {
		task.AssigneeUserID = &claims.MembershipID
		now := time.Now()
		task.ClaimedAt = &now
	}
	if status == "done" {
		now := time.Now()
		task.CompletedAt = &now
	}
	if status == "blocked" {
		now := time.Now()
		task.RefusedAt = &now
	}
	if err := a.Repo.UpdateTicketingTask(r.Context(), task); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update ticketing task")
		return
	}
	updated, _ := a.Repo.GetTicketingTask(r.Context(), claims.OrganisationID, id)
	if updated == nil {
		httpx.JSON(w, http.StatusOK, ticketingTaskResponse(*task))
		return
	}
	httpx.JSON(w, http.StatusOK, ticketingTaskResponse(*updated))
}

func ticketingTaskFromRequest(input ticketingTaskRequest) models.TicketingTask {
	task := input.TicketingTask
	if input.AssigneeID != nil {
		task.AssigneeUserID = input.AssigneeID
	}
	if input.DueDate != nil {
		task.DueAt = input.DueDate
	}
	return task
}

func normalizeTicketingTask(task *models.TicketingTask) {
	switch task.Status {
	case "", "pending", "open":
		task.Status = "todo"
	case "in_work":
		task.Status = "in_progress"
	}
	switch task.Priority {
	case "", "medium", "normal":
		task.Priority = "normal"
	case "urgent":
		task.Priority = "urgent"
	case "high":
		task.Priority = "high"
	case "low":
		task.Priority = "low"
	default:
		task.Priority = "normal"
	}
}

func frontendTicketStatus(status string) string {
	if status == "in_work" {
		return "in_progress"
	}
	return status
}

func frontendTicketPriority(priority string) string {
	if priority == "normal" {
		return "medium"
	}
	return priority
}

func ticketingTaskResponse(task models.TicketingTask) map[string]any {
	return map[string]any{
		"id":               task.ID,
		"organisation_id":  task.OrganisationID,
		"created_by_id":    task.CreatedByID,
		"owner_id":         task.CreatedByID,
		"assignee_user_id": task.AssigneeUserID,
		"assignee_id":      task.AssigneeUserID,
		"client_id":        task.ClientID,
		"title":            task.Title,
		"description":      task.Description,
		"status":           frontendTicketStatus(task.Status),
		"priority":         frontendTicketPriority(task.Priority),
		"source_type":      task.SourceType,
		"source":           task.SourceType,
		"source_id":        task.SourceID,
		"due_at":           task.DueAt,
		"due_date":         task.DueAt,
		"claimed_at":       task.ClaimedAt,
		"completed_at":     task.CompletedAt,
		"refused_at":       task.RefusedAt,
		"created_at":       task.CreatedAt,
		"updated_at":       task.UpdatedAt,
	}
}
