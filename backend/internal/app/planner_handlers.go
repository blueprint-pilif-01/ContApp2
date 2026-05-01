package app

import (
	"backend/internal/platform/httpx"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

type plannerEventResponse struct {
	ID              int64           `json:"id"`
	Title           string          `json:"title"`
	Date            string          `json:"date"`
	DateEnd         *string         `json:"date_end,omitempty"`
	DurationMinutes int             `json:"duration_minutes,omitempty"`
	Category        string          `json:"category"`
	LinkedID        *int64          `json:"linked_id,omitempty"`
	Recurrence      json.RawMessage `json:"recurrence,omitempty"`
}

type plannerEventRequest struct {
	Title           string          `json:"title"`
	Date            string          `json:"date"`
	DateEnd         json.RawMessage `json:"date_end"`
	DurationMinutes int             `json:"duration_minutes"`
	Category        string          `json:"category"`
	LinkedID        *int64          `json:"linked_id"`
	Recurrence      json.RawMessage `json:"recurrence"`
}

func (a *App) listPlannerEvents(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, title, starts_at, ends_at, COALESCE(source_type, category, 'custom'), source_id, data
		FROM (
			SELECT
				id,
				title,
				starts_at,
				ends_at,
				category,
				source_type,
				source_id,
				'null'::jsonb AS data
			FROM planner_events
			WHERE organisation_id = $1
				AND deleted_at IS NULL
		) events
		ORDER BY starts_at ASC, id ASC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list planner events")
		return
	}
	defer rows.Close()

	events := make([]plannerEventResponse, 0)
	for rows.Next() {
		event, err := scanPlannerEventResponse(rows)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan planner events")
			return
		}
		events = append(events, event)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"events": events})
}

func (a *App) createPlannerEvent(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input plannerEventRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	startsAt, err := parsePlannerTime(input.Date)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "valid date is required")
		return
	}
	endsAt, err := parsePlannerOptionalTime(input.DateEnd)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "valid date_end is required")
		return
	}
	if input.Title == "" || startsAt.IsZero() {
		httpx.Error(w, http.StatusBadRequest, "title and date are required")
		return
	}
	category := plannerStorageCategory(input.Category)
	sourceType := plannerResponseCategory(input.Category, category)
	var event plannerEventResponse
	var returnedStartsAt, returnedEndsAt time.Time
	var endNull sql.NullTime
	err = a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO planner_events (
			organisation_id, owner_user_id, title, category, starts_at, ends_at, source_type, source_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, title, starts_at, ends_at, COALESCE(source_type, category, 'custom'), source_id
	`, claims.OrganisationID, claims.MembershipID, input.Title, category, startsAt, endsAt, sourceType, input.LinkedID).
		Scan(&event.ID, &event.Title, &returnedStartsAt, &endNull, &event.Category, &event.LinkedID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create planner event")
		return
	}
	event.Date = returnedStartsAt.Format(time.RFC3339)
	if endNull.Valid {
		returnedEndsAt = endNull.Time
		value := returnedEndsAt.Format(time.RFC3339)
		event.DateEnd = &value
		event.DurationMinutes = int(returnedEndsAt.Sub(returnedStartsAt).Minutes())
	}
	if event.DurationMinutes <= 0 {
		event.DurationMinutes = input.DurationMinutes
	}
	httpx.JSON(w, http.StatusCreated, event)
}

func (a *App) deletePlannerEvent(w http.ResponseWriter, r *http.Request) {
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
		UPDATE planner_events
		SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete planner event")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Event deleted."})
}

func (a *App) getPlannerSmart(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT 'task' AS type, title, id
		FROM ticketing_tasks
		WHERE organisation_id = $1
			AND deleted_at IS NULL
			AND status NOT IN ('done', 'closed')
		ORDER BY
			CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,
			due_at ASC,
			created_at DESC
		LIMIT 5
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load planner smart")
		return
	}
	defer rows.Close()

	focus := make([]map[string]any, 0)
	for rows.Next() {
		var itemType, title string
		var id int64
		if err := rows.Scan(&itemType, &title, &id); err != nil {
			continue
		}
		focus = append(focus, map[string]any{
			"type":  itemType,
			"title": title,
			"id":    id,
		})
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"focus":        focus,
		"generated_at": time.Now().UTC().Format(time.RFC3339),
	})
}

func scanPlannerEventResponse(row interface {
	Scan(dest ...any) error
}) (plannerEventResponse, error) {
	var event plannerEventResponse
	var startsAt time.Time
	var endsAt sql.NullTime
	var recurrence json.RawMessage
	err := row.Scan(&event.ID, &event.Title, &startsAt, &endsAt, &event.Category, &event.LinkedID, &recurrence)
	if err != nil {
		return event, err
	}
	event.Date = startsAt.Format(time.RFC3339)
	if endsAt.Valid {
		value := endsAt.Time.Format(time.RFC3339)
		event.DateEnd = &value
		event.DurationMinutes = int(endsAt.Time.Sub(startsAt).Minutes())
	}
	if len(recurrence) > 0 && string(recurrence) != "null" {
		event.Recurrence = recurrence
	}
	return event, nil
}

func parsePlannerTime(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, nil
	}
	return time.Parse(time.RFC3339, value)
}

func parsePlannerOptionalTime(raw json.RawMessage) (*time.Time, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}
	var value string
	if err := json.Unmarshal(raw, &value); err != nil {
		return nil, err
	}
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func plannerStorageCategory(category string) string {
	switch category {
	case "contract", "meeting", "reminder", "hr", "custom":
		return category
	case "hr_leave":
		return "hr"
	case "personal", "task":
		return "custom"
	default:
		return "custom"
	}
}

func plannerResponseCategory(inputCategory, storageCategory string) string {
	switch inputCategory {
	case "contract", "hr_leave", "task", "personal":
		return inputCategory
	default:
		return storageCategory
	}
}
