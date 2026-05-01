package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type contractTemplateRequest struct {
	Name           string          `json:"name"`
	ContractType   string          `json:"contract_type"`
	Type           string          `json:"type"`
	ContentJSON    json.RawMessage `json:"content_json"`
	Content        json.RawMessage `json:"content"`
	Status         string          `json:"status"`
	UserID         int64           `json:"user_id"`
	OrganisationID int64           `json:"organisation_id"`
}

type contractInviteRequest struct {
	models.ContractInvite
	PublicToken  string `json:"public_token"`
	UserID       int64  `json:"user_id"`
	DateAdded    string `json:"date_added"`
	DateModified string `json:"date_modified"`
}

type contractSubmissionRequest struct {
	models.ContractSubmission
	UserID         int64   `json:"user_id"`
	Remarks        string  `json:"remarks"`
	ExpirationDate string  `json:"expiration_date"`
	DateAdded      string  `json:"date_added"`
	DateModified   string  `json:"date_modified"`
	SignatureImage *string `json:"signature_image"`
}

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
	var input contractTemplateRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item := contractTemplateFromRequest(input)
	if strings.TrimSpace(item.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
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
	var input contractTemplateRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item := contractTemplateFromRequest(input)
	if strings.TrimSpace(item.Name) == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
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

func contractTemplateFromRequest(input contractTemplateRequest) models.ContractTemplate {
	content := input.ContentJSON
	if len(content) == 0 {
		content = input.Content
	}
	if len(content) == 0 {
		content = json.RawMessage(`{}`)
	}
	contractType := strings.TrimSpace(input.ContractType)
	if contractType == "" {
		contractType = strings.TrimSpace(input.Type)
	}
	if contractType == "" {
		contractType = "generic"
	}
	return models.ContractTemplate{
		Name:         strings.TrimSpace(input.Name),
		ContractType: contractType,
		ContentJSON:  content,
		Status:       strings.TrimSpace(input.Status),
	}
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
	response := make([]map[string]any, 0, len(items))
	for _, item := range items {
		response = append(response, contractInviteResponse(item))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"invites": response})
}

func (a *App) createContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input contractInviteRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item := input.ContractInvite
	item.TokenHash = strings.TrimSpace(item.TokenHash)
	if item.TokenHash == "" {
		item.TokenHash = strings.TrimSpace(input.PublicToken)
	}
	if item.TokenHash == "" {
		item.TokenHash = newPublicToken()
	}
	item.OrganisationID = claims.OrganisationID
	item.CreatedByID = claims.MembershipID
	if err := a.Repo.CreateContractInvite(r.Context(), &item); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create contract invite")
		return
	}
	httpx.JSON(w, http.StatusCreated, contractInviteResponse(item))
}

func (a *App) updateContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input contractInviteRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item := input.ContractInvite
	item.OrganisationID = claims.OrganisationID
	item.ID = id
	if item.Status == "" {
		item.Status = "draft"
	}
	updated, err := updateContractInviteRecord(r, a, item)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update contract invite")
		return
	}
	httpx.JSON(w, http.StatusOK, contractInviteResponse(*updated))
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
	httpx.JSON(w, http.StatusOK, contractInviteResponse(*item))
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
	var input contractSubmissionRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	item := input.ContractSubmission
	item.OrganisationID = claims.OrganisationID
	if item.FilledFields == nil {
		item.FilledFields = json.RawMessage(`{}`)
	}
	if item.Status == "" {
		item.Status = "signed"
	}
	if item.SignedAt == nil && item.Status == "signed" {
		now := time.Now().UTC()
		item.SignedAt = &now
	}
	if item.TemplateID == 0 && item.InviteID != 0 {
		invite, err := a.Repo.GetContractInvite(r.Context(), claims.OrganisationID, item.InviteID)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "invite not found")
			return
		}
		item.TemplateID = invite.TemplateID
		if item.ClientID == 0 {
			item.ClientID = invite.ClientID
		}
	}
	if item.InviteID == 0 || item.TemplateID == 0 || item.ClientID == 0 {
		httpx.Error(w, http.StatusBadRequest, "invite_id, template_id and client_id are required")
		return
	}
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

func (a *App) downloadContractSubmissionPDF(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	submission, err := a.Repo.GetContractSubmission(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract submission not found")
		return
	}
	filename := "contract-" + strconv.FormatInt(submission.ID, 10) + ".pdf"
	if submission.ContractNumber != nil && *submission.ContractNumber != "" {
		filename = "contract-" + *submission.ContractNumber + ".pdf"
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `attachment; filename="`+safeStorageName(filename)+`"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(minimalPDFBytes(filename))
}

func (a *App) downloadContractSubmissionSignature(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	submission, err := a.Repo.GetContractSubmission(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract submission not found")
		return
	}
	if len(submission.SignatureImage) == 0 {
		httpx.Error(w, http.StatusNotFound, "signature not found")
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", `attachment; filename="signature-`+strconv.FormatInt(submission.ID, 10)+`.png"`)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(submission.SignatureImage)
}

func contractInviteResponse(invite models.ContractInvite) map[string]any {
	return map[string]any{
		"id":              invite.ID,
		"organisation_id": invite.OrganisationID,
		"template_id":     invite.TemplateID,
		"client_id":       invite.ClientID,
		"user_id":         invite.CreatedByID,
		"created_by_id":   invite.CreatedByID,
		"token_hash":      invite.TokenHash,
		"public_token":    invite.TokenHash,
		"status":          invite.Status,
		"remarks":         invite.Remarks,
		"expiration_date": invite.ExpirationDate,
		"sent_at":         invite.SentAt,
		"viewed_at":       invite.ViewedAt,
		"revoked_at":      invite.RevokedAt,
		"signed_at":       invite.SignedAt,
		"created_at":      invite.CreatedAt,
		"updated_at":      invite.UpdatedAt,
		"date_added":      invite.CreatedAt,
		"date_modified":   invite.UpdatedAt,
	}
}

func newPublicToken() string {
	var b [24]byte
	if _, err := rand.Read(b[:]); err != nil {
		return hex.EncodeToString([]byte(time.Now().UTC().Format("20060102150405.000000000")))
	}
	return hex.EncodeToString(b[:])
}

func updateContractInviteRecord(r *http.Request, a *App, invite models.ContractInvite) (*models.ContractInvite, error) {
	err := a.Repo.Connection().QueryRowContext(r.Context(), `
		UPDATE contract_invites
		SET status = COALESCE(NULLIF($3, ''), status),
			remarks = $4,
			expiration_date = $5,
			updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
		RETURNING id, organisation_id, template_id, client_id, created_by_id, token_hash,
			status, remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at,
			created_at, updated_at, deleted_at
	`, invite.OrganisationID, invite.ID, invite.Status, invite.Remarks, invite.ExpirationDate).Scan(
		&invite.ID,
		&invite.OrganisationID,
		&invite.TemplateID,
		&invite.ClientID,
		&invite.CreatedByID,
		&invite.TokenHash,
		&invite.Status,
		&invite.Remarks,
		&invite.ExpirationDate,
		&invite.SentAt,
		&invite.ViewedAt,
		&invite.RevokedAt,
		&invite.SignedAt,
		&invite.CreatedAt,
		&invite.UpdatedAt,
		&invite.DeletedAt,
	)
	return &invite, err
}

func minimalPDFBytes(title string) []byte {
	escaped := strings.NewReplacer(`\`, `\\`, `(`, `\(`, `)`, `\)`).Replace(title)
	content := "BT /F1 16 Tf 72 720 Td (" + escaped + ") Tj ET"
	return []byte("%PDF-1.4\n" +
		"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
		"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
		"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n" +
		"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n" +
		"5 0 obj << /Length " + strconv.Itoa(len(content)) + " >> stream\n" +
		content + "\nendstream endobj\n" +
		"trailer << /Root 1 0 R >>\n%%EOF\n")
}
