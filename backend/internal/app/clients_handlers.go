package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type clientRequest struct {
	ClientType       string `json:"client_type"`
	FirstName        string `json:"first_name"`
	LastName         string `json:"last_name"`
	CompanyName      string `json:"company_name"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	CNP              any    `json:"cnp"`
	CUI              any    `json:"cui"`
	TVA              bool   `json:"tva"`
	ResponsibleName  string `json:"responsible_name"`
	ResponsibleEmail string `json:"responsible_email"`
	Address          string `json:"address"`
	Status           string `json:"status"`
	UserID           int64  `json:"user_id"`
	OrganisationID   int64  `json:"organisation_id"`
	SignatureID      int64  `json:"signature_id"`
}

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
	var input clientRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	client := clientFromRequest(input)
	client.OrganisationID = claims.OrganisationID
	client.OwnerUserID = &claims.MembershipID
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
	var input clientRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	client := clientFromRequest(input)
	client.ID = id
	client.OrganisationID = claims.OrganisationID
	if err := a.Repo.UpdateClient(r.Context(), &client); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update client")
		return
	}
	httpx.JSON(w, http.StatusOK, client)
}

func clientFromRequest(input clientRequest) models.Client {
	clientType := strings.TrimSpace(input.ClientType)
	if clientType != "company" {
		clientType = "person"
	}
	status := strings.TrimSpace(input.Status)
	if status == "" {
		status = "active"
	}
	cnp := stringPtrOrNil(anyToString(input.CNP))
	cui := stringPtrOrNil(anyToString(input.CUI))
	if clientType == "company" && cui == nil && cnp != nil {
		cui = cnp
		cnp = nil
	}
	return models.Client{
		ClientType:       clientType,
		FirstName:        stringPtrOrNil(input.FirstName),
		LastName:         stringPtrOrNil(input.LastName),
		CompanyName:      stringPtrOrNil(input.CompanyName),
		Email:            stringPtrOrNil(input.Email),
		Phone:            stringPtrOrNil(input.Phone),
		CNP:              cnp,
		CUI:              cui,
		TVA:              input.TVA,
		ResponsibleName:  stringPtrOrNil(input.ResponsibleName),
		ResponsibleEmail: stringPtrOrNil(input.ResponsibleEmail),
		Address:          stringPtrOrNil(input.Address),
		Status:           status,
	}
}

func anyToString(value any) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(v)
	case float64:
		if v == 0 {
			return ""
		}
		return strconv.FormatInt(int64(v), 10)
	default:
		return strings.TrimSpace(fmt.Sprint(v))
	}
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
