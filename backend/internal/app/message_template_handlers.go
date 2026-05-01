package app

import (
	"backend/internal/platform/httpx"
	"net/http"
	"strings"
	"time"
)

type messageTemplateRequest struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Category string `json:"category"`
}

func (a *App) listMessageTemplates(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, title, content, category, usage_count, created_at
		FROM message_templates
		WHERE organisation_id = $1
			AND deleted_at IS NULL
		ORDER BY created_at DESC, id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list message templates")
		return
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		item, err := scanMessageTemplate(rows)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan message templates")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"templates": items})
}

func (a *App) createMessageTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input messageTemplateRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	title := strings.TrimSpace(input.Title)
	content := strings.TrimSpace(input.Content)
	category := defaultString(strings.TrimSpace(input.Category), "general")
	if title == "" || content == "" {
		httpx.Error(w, http.StatusBadRequest, "title and content are required")
		return
	}
	row := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO message_templates (
			organisation_id, created_by_id, title, content, category
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, title, content, category, usage_count, created_at
	`, claims.OrganisationID, claims.MembershipID, title, content, category)
	item, err := scanMessageTemplate(row)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create message template")
		return
	}
	httpx.JSON(w, http.StatusCreated, item)
}

func (a *App) deleteMessageTemplate(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE message_templates
		SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete message template")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

type messageTemplateScanner interface {
	Scan(dest ...any) error
}

func scanMessageTemplate(row messageTemplateScanner) (map[string]any, error) {
	var id int64
	var title, content, category string
	var usageCount int
	var createdAt time.Time
	if err := row.Scan(&id, &title, &content, &category, &usageCount, &createdAt); err != nil {
		return nil, err
	}
	return map[string]any{
		"id":          id,
		"title":       title,
		"content":     content,
		"category":    category,
		"usage_count": usageCount,
		"created_at":  createdAt.Format(time.RFC3339),
	}, nil
}
