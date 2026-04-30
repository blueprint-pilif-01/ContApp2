package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) listClients(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	clients, err := a.Repo.ListClients(r.Context(), claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list clients")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"clients": clients})
}

func (a *App) createClient(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var client models.Client
	if err := httpx.DecodeJSON(r, &client); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	client.OrganisationID = claims.OrganisationID
	client.OwnerUserID = &claims.MembershipID
	if client.ClientType == "" {
		client.ClientType = "person"
	}
	if err := a.Repo.CreateClient(r.Context(), &client); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create client")
		return
	}
	httpx.JSON(w, http.StatusCreated, client)
}

func (a *App) getClient(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	client, err := a.Repo.GetClient(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "client not found")
		return
	}
	httpx.JSON(w, http.StatusOK, client)
}

func (a *App) updateClient(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var client models.Client
	if err := httpx.DecodeJSON(r, &client); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	client.ID = id
	client.OrganisationID = claims.OrganisationID
	if err := a.Repo.UpdateClient(r.Context(), &client); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update client")
		return
	}
	httpx.JSON(w, http.StatusOK, client)
}

func (a *App) deleteClient(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := a.Repo.DeleteClient(r.Context(), claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete client")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "deleted"})
}
