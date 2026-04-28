package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listContractTemplates(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	items, err := a.Repo.ListContractTemplates(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list contract templates")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"templates": items})
}

func (a *App) createContractTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var item models.ContractTemplate
	if err := httpx.DecodeJSON(r, &item); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item.OrganisationID = claims.OrganisationID
	item.CreatedByID = claims.MembershipID
	if err := a.Repo.CreateContractTemplate(r.Context(), &item); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create contract template")
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (a *App) getContractTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := a.Repo.GetContractTemplate(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract template not found")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (a *App) updateContractTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var item models.ContractTemplate
	if err := httpx.DecodeJSON(r, &item); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item.ID = id
	item.OrganisationID = claims.OrganisationID
	if err := a.Repo.UpdateContractTemplate(r.Context(), &item); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update contract template")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (a *App) deleteContractTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteContractTemplate(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete contract template")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}

func (a *App) listContractInvites(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	items, err := a.Repo.ListContractInvites(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list contract invites")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"invites": items})
}

func (a *App) createContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var item models.ContractInvite
	if err := httpx.DecodeJSON(r, &item); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item.OrganisationID = claims.OrganisationID
	item.CreatedByID = claims.MembershipID
	if err := a.Repo.CreateContractInvite(r.Context(), &item); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create contract invite")
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (a *App) getContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := a.Repo.GetContractInvite(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract invite not found")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (a *App) deleteContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteContractInvite(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete contract invite")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}

func (a *App) listContractSubmissions(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	items, err := a.Repo.ListContractSubmissions(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list contract submissions")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"submissions": items})
}

func (a *App) createContractSubmission(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var item models.ContractSubmission
	if err := httpx.DecodeJSON(r, &item); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item.OrganisationID = claims.OrganisationID
	if err := a.Repo.CreateContractSubmission(r.Context(), &item); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create contract submission")
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (a *App) getContractSubmission(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := a.Repo.GetContractSubmission(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract submission not found")
		return
	}
	httpx.JSON(w, http.StatusOK, item)
}

func (a *App) deleteContractSubmission(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteContractSubmission(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete contract submission")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
