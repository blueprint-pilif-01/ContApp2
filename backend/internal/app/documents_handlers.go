package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listFiles(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	files, err := a.Repo.ListFiles(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list files")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"files": files})
}

func (a *App) createFile(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var file models.File
	if err := httpx.DecodeJSON(r, &file); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	file.OrganisationID = claims.OrganisationID
	file.UploadedByID = &claims.MembershipID
	if err := a.Repo.CreateFile(r.Context(), &file); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create file")
		return
	}
	httpx.JSON(w, http.StatusCreated, file)
}

func (a *App) getFile(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	file, err := a.Repo.GetFile(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "file not found")
		return
	}
	httpx.JSON(w, http.StatusOK, file)
}

func (a *App) deleteFile(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteFile(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete file")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}

func (a *App) listOrganisationDocuments(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	documents, err := a.Repo.ListOrganisationDocuments(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list documents")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"documents": documents})
}

func (a *App) createOrganisationDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var document models.OrganisationDocument
	if err := httpx.DecodeJSON(r, &document); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	document.OrganisationID = claims.OrganisationID
	document.UploadedByID = &claims.MembershipID
	if err := a.Repo.CreateOrganisationDocument(r.Context(), &document); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create document")
		return
	}
	httpx.JSON(w, http.StatusCreated, document)
}

func (a *App) getOrganisationDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	document, err := a.Repo.GetOrganisationDocument(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "document not found")
		return
	}
	httpx.JSON(w, http.StatusOK, document)
}

func (a *App) deleteOrganisationDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteOrganisationDocument(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete document")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}

func (a *App) listClientDocuments(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	clientID, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	documents, err := a.Repo.ListClientDocuments(r.Context(), claims.OrganisationID, clientID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list client documents")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"documents": documents})
}

func (a *App) createClientDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var document models.ClientDocument
	if err := httpx.DecodeJSON(r, &document); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	document.OrganisationID = claims.OrganisationID
	if err := a.Repo.CreateClientDocument(r.Context(), &document); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create client document")
		return
	}
	httpx.JSON(w, http.StatusCreated, document)
}

func (a *App) getClientDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	document, err := a.Repo.GetClientDocument(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "client document not found")
		return
	}
	httpx.JSON(w, http.StatusOK, document)
}

func (a *App) deleteClientDocument(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteClientDocument(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete client document")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
