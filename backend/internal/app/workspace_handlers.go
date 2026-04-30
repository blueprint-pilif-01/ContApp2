package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
	"time"
)

type notebookDocumentResponse struct {
	ID           int64     `json:"id"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	Visibility   string    `json:"visibility"`
	OwnerID      int64     `json:"owner_id"`
	DateModified time.Time `json:"date_modified"`
}

type notebookDocumentRequest struct {
	Title        string `json:"title"`
	Content      string `json:"content"`
	Visibility   string `json:"visibility"`
	DateModified string `json:"date_modified"`
	OwnerID      int64  `json:"owner_id"`
	ClientID     *int64 `json:"client_id"`
}

func (a *App) listNotebookDocuments(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	notes, err := a.Repo.ListWorkspaceNotes(r.Context(), claims.OrganisationID, claims.MembershipID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list notebook documents")
		return
	}
	documents := make([]notebookDocumentResponse, 0, len(notes))
	for _, note := range notes {
		documents = append(documents, notebookDocumentFromNote(note))
	}
	httpx.JSON(w, http.StatusOK, documents)
}

func (a *App) createNotebookDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input notebookDocumentRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	note := models.WorkspaceNote{
		OrganisationID: claims.OrganisationID,
		OwnerUserID:    claims.MembershipID,
		Visibility:     noteVisibilityFromNotebook(input.Visibility),
		Title:          defaultNotebookTitle(input.Title),
		Body:           input.Content,
	}
	if err := a.Repo.CreateWorkspaceNote(r.Context(), &note); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create notebook document")
		return
	}
	httpx.JSON(w, http.StatusCreated, notebookDocumentFromNote(note))
}

func (a *App) updateNotebookDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input notebookDocumentRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	note := models.WorkspaceNote{
		ID:             id,
		OrganisationID: claims.OrganisationID,
		OwnerUserID:    claims.MembershipID,
		Visibility:     noteVisibilityFromNotebook(input.Visibility),
		Title:          defaultNotebookTitle(input.Title),
		Body:           input.Content,
	}
	if err := a.Repo.UpdateWorkspaceNote(r.Context(), &note); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update notebook document")
		return
	}
	httpx.JSON(w, http.StatusOK, notebookDocumentFromNote(note))
}

func (a *App) deleteNotebookDocument(w http.ResponseWriter, r *http.Request) {
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
		httpx.Error(w, http.StatusInternalServerError, "could not delete notebook document")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func notebookDocumentFromNote(note models.WorkspaceNote) notebookDocumentResponse {
	return notebookDocumentResponse{
		ID:           note.ID,
		Title:        note.Title,
		Content:      note.Body,
		Visibility:   notebookVisibilityFromNote(note.Visibility),
		OwnerID:      note.OwnerUserID,
		DateModified: note.UpdatedAt,
	}
}

func notebookVisibilityFromNote(visibility string) string {
	if visibility == "shared" {
		return "shared"
	}
	return "private"
}

func noteVisibilityFromNotebook(visibility string) string {
	if visibility == "shared" {
		return "shared"
	}
	return "personal"
}

func defaultNotebookTitle(title string) string {
	if title == "" {
		return "Document fara titlu"
	}
	return title
}

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
