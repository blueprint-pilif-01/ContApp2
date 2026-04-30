package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listWorkspaceNotes(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	notes, err := a.Repo.ListWorkspaceNotes(r.Context(), claims.OrganisationID, claims.MembershipID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list workspace notes")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"notes": notes})
}

func (a *App) createWorkspaceNote(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var note models.WorkspaceNote
	if err := httpx.DecodeJSON(r, &note); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	note.OrganisationID = claims.OrganisationID
	note.OwnerUserID = claims.MembershipID
	if err := a.Repo.CreateWorkspaceNote(r.Context(), &note); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create workspace note")
		return
	}
	httpx.JSON(w, http.StatusCreated, note)
}

func (a *App) getWorkspaceNote(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	note, err := a.Repo.GetWorkspaceNote(r.Context(), claims.OrganisationID, claims.MembershipID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "workspace note not found")
		return
	}
	httpx.JSON(w, http.StatusOK, note)
}

func (a *App) updateWorkspaceNote(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var note models.WorkspaceNote
	if err := httpx.DecodeJSON(r, &note); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	note.ID = id
	note.OrganisationID = claims.OrganisationID
	note.OwnerUserID = claims.MembershipID
	if err := a.Repo.UpdateWorkspaceNote(r.Context(), &note); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update workspace note")
		return
	}
	httpx.JSON(w, http.StatusOK, note)
}

func (a *App) deleteWorkspaceNote(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteWorkspaceNote(r.Context(), claims.OrganisationID, claims.MembershipID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete workspace note")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
