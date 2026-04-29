package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"net/http"
)

func (a *App) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := claimsFromContext(r.Context())
		if !ok || claims.ActorType != "admin" {
			httpx.Error(w, http.StatusForbidden, "platform admin token required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *App) listAdminOrganisations(w http.ResponseWriter, r *http.Request) {
	organisations, err := a.Repo.ListOrganisations(r.Context())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisations")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"organisations": organisations})
}

func (a *App) createAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	var organisation models.Organisation
	if err := httpx.DecodeJSON(r, &organisation); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if organisation.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	if err := a.Repo.CreateOrganisation(r.Context(), &organisation); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create organisation")
		return
	}
	httpx.JSON(w, http.StatusCreated, organisation)
}

func (a *App) getAdminOrganisation(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	organisation, err := a.Repo.GetOrganisationByID(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "organisation not found")
		return
	}
	httpx.JSON(w, http.StatusOK, organisation)
}

type statusRequest struct {
	Status string `json:"status"`
}

func (a *App) updateAdminOrganisationStatus(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input statusRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || input.Status == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := a.Repo.UpdateOrganisationStatus(r.Context(), id, input.Status); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update organisation status")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"status": "updated"})
}

func (a *App) listAdminOrganisationFeatures(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	features, err := a.Repo.ListOrganisationFeatures(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation features")
		return
	}
	limits, err := a.Repo.ListOrganisationFeatureLimits(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation feature limits")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"features": features, "limits": limits})
}

func (a *App) listAdminOrganisationSubscriptions(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	subscriptions, err := a.Repo.ListOrganisationSubscriptions(r.Context(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list organisation subscriptions")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"subscriptions": subscriptions})
}
