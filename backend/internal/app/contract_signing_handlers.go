package app

import (
	"backend/internal/dto"
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type publicSignPayload struct {
	Invite     publicSignInvite  `json:"invite"`
	Template   *publicTemplate   `json:"template"`
	Content    json.RawMessage   `json:"content"`
	ClientHint *publicClientHint `json:"client_hint"`
}

type publicSignInvite struct {
	ID             int64      `json:"id"`
	PublicToken    string     `json:"public_token"`
	Status         string     `json:"status"`
	ExpirationDate *time.Time `json:"expiration_date"`
	Remarks        string     `json:"remarks"`
}

type publicTemplate struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	ContractType string `json:"contract_type"`
}

type publicClientHint struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Email     string `json:"email,omitempty"`
}

func (a *App) sendContractInvite(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	invite, err := a.Repo.GetContractInvite(r.Context(), claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "contract invite not found")
		return
	}
	if invite.TokenHash == "" {
		invite.TokenHash = newPublicToken()
	}
	err = a.Repo.Connection().QueryRowContext(r.Context(), `
		UPDATE contract_invites
		SET status = CASE WHEN status = 'signed' THEN status ELSE 'sent' END,
			token_hash = $3,
			sent_at = COALESCE(sent_at, now()),
			updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
		RETURNING id, organisation_id, template_id, client_id, created_by_id, token_hash,
			status, remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at,
			created_at, updated_at, deleted_at
	`, claims.OrganisationID, id, invite.TokenHash).Scan(
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
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not send contract invite")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"message":    "Invite sent.",
		"invite":     dto.ContractInviteFromModel(*invite),
		"public_url": publicSignURL(r, invite.TokenHash),
	})
}

func (a *App) getPublicSignInvite(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(chi.URLParam(r, "token"))
	if token == "" {
		httpx.Error(w, http.StatusBadRequest, "missing token")
		return
	}
	payload, err := a.loadPublicSignPayload(r, token, true)
	if err != nil {
		if err == sql.ErrNoRows {
			httpx.Error(w, http.StatusNotFound, "signing link not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "could not load signing link")
		return
	}
	if payload.Invite.ExpirationDate != nil && time.Now().UTC().After(payload.Invite.ExpirationDate.UTC()) {
		httpx.Error(w, http.StatusGone, "signing link expired")
		return
	}
	if payload.Invite.Status == "revoked" {
		httpx.Error(w, http.StatusGone, "signing link revoked")
		return
	}
	httpx.JSON(w, http.StatusOK, payload)
}

type publicSignSubmitRequest struct {
	FilledFields   json.RawMessage `json:"filled_fields"`
	SignatureImage string          `json:"signature_image"`
	AcceptedAt     *time.Time      `json:"accepted_at"`
}

func (a *App) submitPublicSignInvite(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimSpace(chi.URLParam(r, "token"))
	if token == "" {
		httpx.Error(w, http.StatusBadRequest, "missing token")
		return
	}
	var input publicSignSubmitRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(input.FilledFields) == 0 {
		input.FilledFields = json.RawMessage(`{}`)
	}
	signature, err := decodeSignatureDataURL(input.SignatureImage)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid signature image")
		return
	}
	result, err := a.createPublicSubmission(r, token, input.FilledFields, signature)
	if err != nil {
		if err == sql.ErrNoRows {
			httpx.Error(w, http.StatusNotFound, "signing link not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, "could not submit signed contract")
		return
	}
	httpx.JSON(w, http.StatusCreated, result)
}

func (a *App) loadPublicSignPayload(r *http.Request, token string, markViewed bool) (*publicSignPayload, error) {
	if markViewed {
		_, _ = a.Repo.Connection().ExecContext(r.Context(), `
			UPDATE contract_invites
			SET status = CASE WHEN status IN ('draft', 'sent') THEN 'viewed' ELSE status END,
				viewed_at = COALESCE(viewed_at, now()),
				updated_at = now()
			WHERE token_hash = $1
				AND deleted_at IS NULL
		`, token)
	}

	var payload publicSignPayload
	var remarks sql.NullString
	var firstName, lastName, companyName, email sql.NullString
	payload.Template = &publicTemplate{}
	payload.ClientHint = &publicClientHint{}
	err := a.Repo.Connection().QueryRowContext(r.Context(), `
		SELECT
			ci.id,
			ci.token_hash,
			ci.status,
			ci.expiration_date,
			ci.remarks,
			ct.id,
			ct.name,
			ct.contract_type,
			ct.content_json,
			c.first_name,
			c.last_name,
			c.company_name,
			c.email
		FROM contract_invites ci
		JOIN contract_templates ct
			ON ct.id = ci.template_id
			AND ct.organisation_id = ci.organisation_id
			AND ct.deleted_at IS NULL
		JOIN clients c
			ON c.id = ci.client_id
			AND c.organisation_id = ci.organisation_id
			AND c.deleted_at IS NULL
		WHERE ci.token_hash = $1
			AND ci.deleted_at IS NULL
	`, token).Scan(
		&payload.Invite.ID,
		&payload.Invite.PublicToken,
		&payload.Invite.Status,
		&payload.Invite.ExpirationDate,
		&remarks,
		&payload.Template.ID,
		&payload.Template.Name,
		&payload.Template.ContractType,
		&payload.Content,
		&firstName,
		&lastName,
		&companyName,
		&email,
	)
	if err != nil {
		return nil, err
	}
	payload.Invite.Remarks = remarks.String
	payload.ClientHint.FirstName = firstName.String
	payload.ClientHint.LastName = lastName.String
	if payload.ClientHint.FirstName == "" && companyName.String != "" {
		payload.ClientHint.FirstName = companyName.String
	}
	payload.ClientHint.Email = email.String
	return &payload, nil
}

func (a *App) createPublicSubmission(r *http.Request, token string, filledFields json.RawMessage, signature []byte) (map[string]any, error) {
	tx, err := a.Repo.Connection().BeginTx(r.Context(), nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var invite models.ContractInvite
	err = tx.QueryRowContext(r.Context(), `
		SELECT id, organisation_id, template_id, client_id, created_by_id, token_hash,
			status, remarks, expiration_date, sent_at, viewed_at, revoked_at, signed_at,
			created_at, updated_at, deleted_at
		FROM contract_invites
		WHERE token_hash = $1
			AND deleted_at IS NULL
		FOR UPDATE
	`, token).Scan(
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
	if err != nil {
		return nil, err
	}
	if invite.ExpirationDate != nil && time.Now().UTC().After(invite.ExpirationDate.UTC()) {
		return nil, sql.ErrNoRows
	}
	if invite.Status == "revoked" {
		return nil, sql.ErrNoRows
	}

	var existingID int64
	var existingNumber sql.NullString
	err = tx.QueryRowContext(r.Context(), `
		SELECT id, contract_number
		FROM contract_submissions
		WHERE invite_id = $1
			AND deleted_at IS NULL
	`, invite.ID).Scan(&existingID, &existingNumber)
	if err == nil {
		if err := tx.Commit(); err != nil {
			return nil, err
		}
		return map[string]any{
			"message":         "Contract already signed.",
			"submission_id":   existingID,
			"contract_number": existingNumber.String,
		}, nil
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	year := time.Now().UTC().Year()
	var nextNumber int
	if err := tx.QueryRowContext(r.Context(), `
		INSERT INTO contract_numbers (organisation_id, year, last_number)
		VALUES ($1, $2, 1)
		ON CONFLICT (organisation_id, year)
		DO UPDATE SET last_number = contract_numbers.last_number + 1
		RETURNING last_number
	`, invite.OrganisationID, year).Scan(&nextNumber); err != nil {
		return nil, err
	}
	contractNumber := strings.Join([]string{time.Now().UTC().Format("2006"), stringsPadNumber(nextNumber, 4)}, "-")
	signedAt := time.Now().UTC()

	var submissionID int64
	if err := tx.QueryRowContext(r.Context(), `
		INSERT INTO contract_submissions (
			organisation_id, invite_id, template_id, client_id, filled_fields,
			signature_image, contract_number, status, signed_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'signed', $8)
		RETURNING id
	`, invite.OrganisationID, invite.ID, invite.TemplateID, invite.ClientID, filledFields, signature, contractNumber, signedAt).Scan(&submissionID); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(r.Context(), `
		UPDATE contract_invites
		SET status = 'signed',
			signed_at = $2,
			updated_at = now()
		WHERE id = $1
	`, invite.ID, signedAt); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return map[string]any{
		"message":         "Contract signed.",
		"submission_id":   submissionID,
		"contract_number": contractNumber,
	}, nil
}

func decodeSignatureDataURL(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	if idx := strings.Index(value, ","); idx >= 0 {
		value = value[idx+1:]
	}
	return base64.StdEncoding.DecodeString(value)
}

func publicSignURL(r *http.Request, token string) string {
	proto := r.Header.Get("X-Forwarded-Proto")
	if proto == "" {
		proto = "http"
	}
	host := r.Header.Get("X-Forwarded-Host")
	if host == "" {
		host = r.Host
	}
	return proto + "://" + host + "/public/sign/" + token
}

func stringsPadNumber(value int, width int) string {
	out := strconv.Itoa(value)
	for len(out) < width {
		out = "0" + out
	}
	return out
}
