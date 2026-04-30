package app

import (
	"backend/internal/platform/httpx"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type dashboardOverviewResponse struct {
	KPIs             dashboardKPIs           `json:"kpis"`
	ContractPipeline dashboardPipeline       `json:"contract_pipeline"`
	UrgentItems      []dashboardUrgentItem   `json:"urgent_items"`
	RecentActivity   []dashboardActivity     `json:"recent_activity"`
	Upcoming         []dashboardUpcoming     `json:"upcoming"`
	TeamWorkload     []dashboardTeamWorkload `json:"team_workload"`
	PlanUsage        dashboardPlanUsage      `json:"plan_usage"`
}

type dashboardKPIs struct {
	ClientsNewThisMonth  int `json:"clients_new_this_month"`
	Clients              int `json:"clients"`
	InvitesActive        int `json:"invites_active"`
	InvitesExpiringSoon  int `json:"invites_expiring_soon"`
	SubmissionsTotal     int `json:"submissions_total"`
	SubmissionsThisMonth int `json:"submissions_this_month"`
	TasksOpen            int `json:"tasks_open"`
	TasksOverdue         int `json:"tasks_overdue"`
	TasksDueToday        int `json:"tasks_due_today"`
}

type dashboardPipeline struct {
	Draft   int `json:"draft"`
	Sent    int `json:"sent"`
	Viewed  int `json:"viewed"`
	Signed  int `json:"signed"`
	Expired int `json:"expired"`
}

type dashboardUrgentItem struct {
	ID     string `json:"id"`
	Type   string `json:"type"`
	Title  string `json:"title"`
	Detail string `json:"detail"`
	Due    string `json:"due"`
	Link   string `json:"link"`
}

type dashboardActivity struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	At    string `json:"at"`
	Type  string `json:"type"`
	Actor string `json:"actor"`
}

type dashboardUpcoming struct {
	ID       int64   `json:"id"`
	Title    string  `json:"title"`
	Date     string  `json:"date"`
	DateEnd  *string `json:"date_end,omitempty"`
	Category string  `json:"category"`
}

type dashboardTeamWorkload struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Open         int    `json:"open"`
	InProgress   int    `json:"in_progress"`
	DoneThisWeek int    `json:"done_this_week"`
}

type dashboardPlanUsage struct {
	Plan      string              `json:"plan"`
	Templates dashboardUsageValue `json:"templates"`
	Signings  dashboardUsageValue `json:"signings"`
	Clients   dashboardUsageValue `json:"clients"`
	StorageMB dashboardUsageValue `json:"storage_mb"`
}

type dashboardUsageValue struct {
	Used  int  `json:"used"`
	Limit *int `json:"limit"`
}

func (a *App) getDashboardOverview(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	orgID := claims.OrganisationID
	db := a.Repo.Connection()

	response := dashboardOverviewResponse{
		KPIs: dashboardKPIs{
			Clients: countRows(r.Context(), db, `
				SELECT count(*) FROM clients
				WHERE organisation_id = $1 AND deleted_at IS NULL
			`, orgID),
			ClientsNewThisMonth: countRows(r.Context(), db, `
				SELECT count(*) FROM clients
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND created_at >= date_trunc('month', now())
			`, orgID),
			InvitesActive: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_invites
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND status IN ('draft', 'sent', 'viewed')
			`, orgID),
			InvitesExpiringSoon: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_invites
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND status IN ('draft', 'sent', 'viewed')
					AND expiration_date >= now()
					AND expiration_date < now() + interval '7 days'
			`, orgID),
			SubmissionsTotal: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_submissions
				WHERE organisation_id = $1 AND deleted_at IS NULL
			`, orgID),
			SubmissionsThisMonth: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_submissions
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND created_at >= date_trunc('month', now())
			`, orgID),
			TasksOpen: countRows(r.Context(), db, `
				SELECT count(*) FROM ticketing_tasks
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND status NOT IN ('done', 'closed')
			`, orgID),
			TasksOverdue: countRows(r.Context(), db, `
				SELECT count(*) FROM ticketing_tasks
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND status NOT IN ('done', 'closed')
					AND due_at < now()
			`, orgID),
			TasksDueToday: countRows(r.Context(), db, `
				SELECT count(*) FROM ticketing_tasks
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND status NOT IN ('done', 'closed')
					AND due_at >= date_trunc('day', now())
					AND due_at < date_trunc('day', now()) + interval '1 day'
			`, orgID),
		},
		ContractPipeline: loadDashboardPipeline(r, db, orgID),
		UrgentItems:      loadDashboardUrgentItems(r, db, orgID),
		RecentActivity:   loadDashboardActivity(r, db, orgID),
		Upcoming:         loadDashboardUpcoming(r, db, orgID),
		TeamWorkload:     loadDashboardTeamWorkload(r, db, orgID),
		PlanUsage:        loadDashboardPlanUsage(r, db, orgID),
	}
	httpx.JSON(w, http.StatusOK, response)
}

func loadDashboardPipeline(r *http.Request, db *sql.DB, orgID int64) dashboardPipeline {
	rows, err := db.QueryContext(r.Context(), `
		SELECT status, count(*)
		FROM contract_invites
		WHERE organisation_id = $1 AND deleted_at IS NULL
		GROUP BY status
	`, orgID)
	if err != nil {
		return dashboardPipeline{}
	}
	defer rows.Close()

	var pipeline dashboardPipeline
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return pipeline
		}
		switch status {
		case "draft":
			pipeline.Draft = count
		case "sent":
			pipeline.Sent = count
		case "viewed":
			pipeline.Viewed = count
		case "signed":
			pipeline.Signed = count
		case "expired":
			pipeline.Expired = count
		}
	}
	return pipeline
}

func loadDashboardUrgentItems(r *http.Request, db *sql.DB, orgID int64) []dashboardUrgentItem {
	items := make([]dashboardUrgentItem, 0, 8)

	inviteRows, err := db.QueryContext(r.Context(), `
		SELECT id, status, expiration_date
		FROM contract_invites
		WHERE organisation_id = $1 AND deleted_at IS NULL
			AND status IN ('draft', 'sent', 'viewed')
			AND expiration_date IS NOT NULL
			AND expiration_date < now() + interval '7 days'
		ORDER BY expiration_date ASC
		LIMIT 4
	`, orgID)
	if err == nil {
		defer inviteRows.Close()
		for inviteRows.Next() {
			var id int64
			var status string
			var due time.Time
			if err := inviteRows.Scan(&id, &status, &due); err != nil {
				continue
			}
			items = append(items, dashboardUrgentItem{
				ID:     fmt.Sprintf("invite-%d", id),
				Type:   "expiring_invite",
				Title:  fmt.Sprintf("Contract invite #%d", id),
				Detail: "Status: " + status,
				Due:    due.Format(time.RFC3339),
				Link:   "/app/contracts/invites",
			})
		}
	}

	taskRows, err := db.QueryContext(r.Context(), `
		SELECT id, title, status, due_at
		FROM ticketing_tasks
		WHERE organisation_id = $1 AND deleted_at IS NULL
			AND status NOT IN ('done', 'closed')
			AND due_at IS NOT NULL
			AND due_at < now() + interval '1 day'
		ORDER BY due_at ASC
		LIMIT 4
	`, orgID)
	if err == nil {
		defer taskRows.Close()
		for taskRows.Next() {
			var id int64
			var title, status string
			var due time.Time
			if err := taskRows.Scan(&id, &title, &status, &due); err != nil {
				continue
			}
			itemType := "overdue_task"
			if status == "blocked" {
				itemType = "blocked_task"
			}
			items = append(items, dashboardUrgentItem{
				ID:     fmt.Sprintf("task-%d", id),
				Type:   itemType,
				Title:  title,
				Detail: "Status: " + status,
				Due:    due.Format(time.RFC3339),
				Link:   "/app/ticketing",
			})
		}
	}
	return items
}

func loadDashboardActivity(r *http.Request, db *sql.DB, orgID int64) []dashboardActivity {
	rows, err := db.QueryContext(r.Context(), `
		SELECT
			e.id,
			e.event_type,
			COALESCE(e.entity_type, 'system'),
			COALESCE(a.first_name || ' ' || a.last_name, e.actor_type, 'System') AS actor,
			e.created_at
		FROM events e
		LEFT JOIN organisation_memberships m ON m.id = e.actor_id
		LEFT JOIN accounts a ON a.id = m.account_id
		WHERE e.organisation_id = $1
		ORDER BY e.created_at DESC, e.id DESC
		LIMIT 8
	`, orgID)
	if err != nil {
		return []dashboardActivity{}
	}
	defer rows.Close()

	items := make([]dashboardActivity, 0, 8)
	for rows.Next() {
		var item dashboardActivity
		var id int64
		var at time.Time
		if err := rows.Scan(&id, &item.Label, &item.Type, &item.Actor, &at); err != nil {
			continue
		}
		item.ID = fmt.Sprintf("event-%d", id)
		item.At = at.Format(time.RFC3339)
		items = append(items, item)
	}
	return items
}

func loadDashboardUpcoming(r *http.Request, db *sql.DB, orgID int64) []dashboardUpcoming {
	items := make([]dashboardUpcoming, 0, 10)

	rows, err := db.QueryContext(r.Context(), `
		SELECT id, title, starts_at, ends_at, COALESCE(category, 'custom')
		FROM planner_events
		WHERE organisation_id = $1 AND deleted_at IS NULL
			AND starts_at >= now()
			AND starts_at < now() + interval '7 days'
		ORDER BY starts_at ASC
		LIMIT 6
	`, orgID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item dashboardUpcoming
			var starts time.Time
			var ends sql.NullTime
			if err := rows.Scan(&item.ID, &item.Title, &starts, &ends, &item.Category); err != nil {
				continue
			}
			item.Date = starts.Format(time.RFC3339)
			if ends.Valid {
				value := ends.Time.Format(time.RFC3339)
				item.DateEnd = &value
			}
			items = append(items, item)
		}
	}
	return items
}

func loadDashboardTeamWorkload(r *http.Request, db *sql.DB, orgID int64) []dashboardTeamWorkload {
	rows, err := db.QueryContext(r.Context(), `
		SELECT
			m.id,
			trim(COALESCE(m.display_name, a.first_name || ' ' || a.last_name)) AS name,
			COUNT(t.id) FILTER (WHERE t.status IN ('pending', 'open', 'todo')) AS open_count,
			COUNT(t.id) FILTER (WHERE t.status IN ('in_work', 'in_progress', 'blocked')) AS in_progress_count,
			COUNT(t.id) FILTER (
				WHERE t.status IN ('done', 'closed')
					AND t.updated_at >= date_trunc('week', now())
			) AS done_this_week
		FROM organisation_memberships m
		JOIN accounts a ON a.id = m.account_id
		LEFT JOIN ticketing_tasks t
			ON t.assignee_user_id = m.id
			AND t.organisation_id = m.organisation_id
			AND t.deleted_at IS NULL
		WHERE m.organisation_id = $1
			AND m.deleted_at IS NULL
		GROUP BY m.id, m.display_name, a.first_name, a.last_name
		ORDER BY open_count DESC, in_progress_count DESC, name ASC
		LIMIT 8
	`, orgID)
	if err != nil {
		return []dashboardTeamWorkload{}
	}
	defer rows.Close()

	items := make([]dashboardTeamWorkload, 0, 8)
	for rows.Next() {
		var item dashboardTeamWorkload
		if err := rows.Scan(&item.ID, &item.Name, &item.Open, &item.InProgress, &item.DoneThisWeek); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items
}

func loadDashboardPlanUsage(r *http.Request, db *sql.DB, orgID int64) dashboardPlanUsage {
	storageBytes := countRows(r.Context(), db, `
		SELECT COALESCE(sum(size_bytes), 0)::bigint
		FROM files
		WHERE organisation_id = $1 AND deleted_at IS NULL
	`, orgID)
	return dashboardPlanUsage{
		Plan: "Free",
		Templates: dashboardUsageValue{
			Used: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_templates
				WHERE organisation_id = $1 AND deleted_at IS NULL
			`, orgID),
		},
		Signings: dashboardUsageValue{
			Used: countRows(r.Context(), db, `
				SELECT count(*) FROM contract_submissions
				WHERE organisation_id = $1 AND deleted_at IS NULL
					AND created_at >= date_trunc('month', now())
			`, orgID),
		},
		Clients: dashboardUsageValue{
			Used: countRows(r.Context(), db, `
				SELECT count(*) FROM clients
				WHERE organisation_id = $1 AND deleted_at IS NULL
			`, orgID),
		},
		StorageMB: dashboardUsageValue{Used: storageBytes / 1024 / 1024},
	}
}

type notificationResponse struct {
	ID        int64   `json:"id"`
	UserID    int64   `json:"user_id"`
	Title     string  `json:"title"`
	Body      string  `json:"body"`
	Kind      string  `json:"kind"`
	Link      *string `json:"link,omitempty"`
	ReadAt    *string `json:"read_at"`
	DateAdded string  `json:"date_added"`
}

func (a *App) listNotifications(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, user_id, title, body, COALESCE(type, 'system'), data, read_at, created_at
		FROM notifications
		WHERE user_id = $1
			AND (organisation_id IS NULL OR organisation_id = $2)
			AND (scheduled_for IS NULL OR scheduled_for <= now())
		ORDER BY created_at DESC, id DESC
		LIMIT 50
	`, claims.MembershipID, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list notifications")
		return
	}
	defer rows.Close()

	items := make([]notificationResponse, 0)
	for rows.Next() {
		var item notificationResponse
		var data json.RawMessage
		var readAt sql.NullTime
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.UserID, &item.Title, &item.Body, &item.Kind, &data, &readAt, &createdAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan notifications")
			return
		}
		if readAt.Valid {
			value := readAt.Time.Format(time.RFC3339)
			item.ReadAt = &value
		}
		item.DateAdded = createdAt.Format(time.RFC3339)
		item.Link = jsonStringField(data, "link")
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (a *App) markNotificationRead(w http.ResponseWriter, r *http.Request) {
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
		UPDATE notifications
		SET read_at = COALESCE(read_at, now())
		WHERE id = $1
			AND user_id = $2
	`, id, claims.MembershipID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not mark notification read")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Notification marked read."})
}

func (a *App) markAllNotificationsRead(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE notifications
		SET read_at = COALESCE(read_at, now())
		WHERE user_id = $1
			AND (organisation_id IS NULL OR organisation_id = $2)
			AND read_at IS NULL
	`, claims.MembershipID, claims.OrganisationID); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not mark notifications read")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Notifications marked read."})
}

type activityLogResponse struct {
	ID          int64   `json:"id"`
	UserID      int64   `json:"user_id"`
	UserName    string  `json:"user_name"`
	Action      string  `json:"action"`
	EntityType  string  `json:"entity_type"`
	EntityID    int64   `json:"entity_id"`
	EntityTitle string  `json:"entity_title"`
	Details     *string `json:"details,omitempty"`
	CreatedAt   string  `json:"created_at"`
	Link        *string `json:"link,omitempty"`
}

func (a *App) listActivityLog(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			e.id,
			COALESCE(e.actor_id, 0),
			COALESCE(trim(a.first_name || ' ' || a.last_name), COALESCE(e.actor_type, 'System')),
			e.event_type,
			COALESCE(e.entity_type, 'system'),
			COALESCE(e.entity_id, 0),
			e.data,
			e.created_at
		FROM events e
		LEFT JOIN organisation_memberships m ON m.id = e.actor_id
		LEFT JOIN accounts a ON a.id = m.account_id
		WHERE e.organisation_id = $1
		ORDER BY e.created_at DESC, e.id DESC
		LIMIT 100
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list activity")
		return
	}
	defer rows.Close()

	items := make([]activityLogResponse, 0)
	for rows.Next() {
		var item activityLogResponse
		var eventType string
		var data json.RawMessage
		var createdAt time.Time
		if err := rows.Scan(&item.ID, &item.UserID, &item.UserName, &eventType, &item.EntityType, &item.EntityID, &data, &createdAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan activity")
			return
		}
		item.Action = actionFromEventType(eventType)
		item.EntityTitle = defaultStringPtr(jsonStringField(data, "title"), fmt.Sprintf("%s #%d", item.EntityType, item.EntityID))
		item.Details = jsonStringField(data, "details")
		item.Link = jsonStringField(data, "link")
		item.CreatedAt = createdAt.Format(time.RFC3339)
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"activity": items})
}

func actionFromEventType(eventType string) string {
	eventType = strings.ToLower(eventType)
	switch {
	case strings.Contains(eventType, "delete"), strings.Contains(eventType, "remove"):
		return "delete"
	case strings.Contains(eventType, "update"), strings.Contains(eventType, "edit"), strings.Contains(eventType, "change"):
		return "update"
	case strings.Contains(eventType, "login"):
		return "login"
	case strings.Contains(eventType, "sign"):
		return "sign"
	default:
		return "create"
	}
}

func jsonStringField(data json.RawMessage, key string) *string {
	if len(data) == 0 {
		return nil
	}
	var payload map[string]any
	if err := json.Unmarshal(data, &payload); err != nil {
		return nil
	}
	value, ok := payload[key].(string)
	if !ok || value == "" {
		return nil
	}
	return &value
}

func defaultStringPtr(value *string, fallback string) string {
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}
