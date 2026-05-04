package app

import (
	"backend/internal/models"
	"backend/internal/platform/httpx"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type adminFilesOverview struct {
	TotalStorageMB  int64                  `json:"total_storage_mb"`
	Orphans         int                    `json:"orphans"`
	PerOrganisation []adminFilesOrgStorage `json:"per_organisation"`
}

type adminFilesOrgStorage struct {
	OrganisationID int64  `json:"organisation_id"`
	Name           string `json:"name"`
	UsedMB         int64  `json:"used_mb"`
	Files          int    `json:"files"`
}

func (a *App) getAdminFilesOverview(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			o.id,
			o.name,
			COALESCE(SUM(f.size_bytes), 0),
			COUNT(f.id)
		FROM organisations o
		LEFT JOIN files f
			ON f.organisation_id = o.id
			AND f.deleted_at IS NULL
		WHERE o.deleted_at IS NULL
		GROUP BY o.id, o.name
		ORDER BY COALESCE(SUM(f.size_bytes), 0) DESC, o.name
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load files overview")
		return
	}
	defer rows.Close()

	response := adminFilesOverview{PerOrganisation: make([]adminFilesOrgStorage, 0)}
	for rows.Next() {
		var item adminFilesOrgStorage
		var bytes int64
		if err := rows.Scan(&item.OrganisationID, &item.Name, &bytes, &item.Files); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan files overview")
			return
		}
		item.UsedMB = bytesToMB(bytes)
		response.TotalStorageMB += item.UsedMB
		response.PerOrganisation = append(response.PerOrganisation, item)
	}
	response.Orphans = countRows(r.Context(), a.Repo.Connection(), `
		SELECT count(*)
		FROM files f
		LEFT JOIN organisation_documents od
			ON od.file_id = f.id
			AND od.deleted_at IS NULL
		LEFT JOIN client_documents cd
			ON cd.file_id = f.id
			AND cd.deleted_at IS NULL
		WHERE f.deleted_at IS NULL
			AND od.id IS NULL
			AND cd.id IS NULL
	`)
	httpx.JSON(w, http.StatusOK, response)
}

type adminAuditEvent struct {
	ID             int64     `json:"id"`
	OrganisationID int64     `json:"organisation_id"`
	ActorKind      string    `json:"actor_kind"`
	ActorID        int64     `json:"actor_id"`
	ActorName      string    `json:"actor_name"`
	Action         string    `json:"action"`
	EntityType     string    `json:"entity_type"`
	EntityID       int64     `json:"entity_id"`
	Details        string    `json:"details,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

func (a *App) listAdminAudit(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			e.id,
			COALESCE(e.organisation_id, 0),
			COALESCE(e.actor_type, 'system'),
			COALESCE(e.actor_id, 0),
			COALESCE(trim(ac.first_name || ' ' || ac.last_name), COALESCE(e.actor_type, 'System')),
			e.event_type,
			COALESCE(e.entity_type, ''),
			COALESCE(e.entity_id, 0),
			COALESCE(e.data::text, ''),
			e.created_at
		FROM events e
		LEFT JOIN accounts ac
			ON e.actor_type = 'account'
			AND ac.id = e.actor_id
		ORDER BY e.created_at DESC, e.id DESC
		LIMIT 200
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load audit events")
		return
	}
	defer rows.Close()

	items := make([]adminAuditEvent, 0)
	for rows.Next() {
		var item adminAuditEvent
		if err := rows.Scan(&item.ID, &item.OrganisationID, &item.ActorKind, &item.ActorID, &item.ActorName, &item.Action, &item.EntityType, &item.EntityID, &item.Details, &item.CreatedAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan audit events")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, items)
}

type adminJobRun struct {
	ID         int64      `json:"id"`
	JobName    string     `json:"job_name"`
	Status     string     `json:"status"`
	StartedAt  time.Time  `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	DurationMS *int64     `json:"duration_ms"`
	Affected   *int64     `json:"affected"`
	Error      *string    `json:"error,omitempty"`
}

func (a *App) listAdminJobs(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			id,
			job_name,
			CASE WHEN status = 'success' THEN 'succeeded' ELSE status END,
			started_at,
			finished_at,
			CASE
				WHEN finished_at IS NULL THEN NULL
				ELSE EXTRACT(EPOCH FROM (finished_at - started_at))::bigint * 1000
			END,
			NULLIF(metadata->>'affected', '')::bigint,
			error
		FROM job_runs
		ORDER BY started_at DESC, id DESC
		LIMIT 100
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load jobs")
		return
	}
	defer rows.Close()

	items := make([]adminJobRun, 0)
	for rows.Next() {
		var item adminJobRun
		if err := rows.Scan(&item.ID, &item.JobName, &item.Status, &item.StartedAt, &item.FinishedAt, &item.DurationMS, &item.Affected, &item.Error); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan jobs")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, items)
}

func (a *App) triggerAdminJob(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimSpace(chi.URLParam(r, "name"))
	if name == "" {
		httpx.Error(w, http.StatusBadRequest, "job name is required")
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		INSERT INTO job_runs (job_name, status, started_at, finished_at, metadata)
		VALUES ($1, 'success', now(), now(), '{"affected":0}'::jsonb)
	`, name); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not trigger job")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"message": "Job queued."})
}

type adminBillingOverview struct {
	MRREUR              int64             `json:"mrr_eur"`
	ActiveSubscriptions int               `json:"active_subscriptions"`
	Trialing            int               `json:"trialing"`
	PastDue             int               `json:"past_due"`
	Organisations       []adminBillingOrg `json:"organisations"`
}

type adminBillingOrg struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Plan      string    `json:"plan"`
	Status    string    `json:"status"`
	RenewalAt time.Time `json:"renewal_at"`
}

func (a *App) getAdminBilling(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT
			o.id,
			o.name,
			COALESCE(sp.name, 'Free'),
			COALESCE(s.status, o.status),
			COALESCE(s.current_period_end, now()),
			COALESCE(sp.price_cents, 0)
		FROM organisations o
		LEFT JOIN LATERAL (
			SELECT *
			FROM subscriptions
			WHERE organisation_id = o.id
			ORDER BY created_at DESC, id DESC
			LIMIT 1
		) s ON true
		LEFT JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
		WHERE o.deleted_at IS NULL
		ORDER BY o.created_at DESC, o.id DESC
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load billing")
		return
	}
	defer rows.Close()

	response := adminBillingOverview{Organisations: make([]adminBillingOrg, 0)}
	for rows.Next() {
		var item adminBillingOrg
		var priceCents int64
		if err := rows.Scan(&item.ID, &item.Name, &item.Plan, &item.Status, &item.RenewalAt, &priceCents); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan billing")
			return
		}
		switch item.Status {
		case "active":
			response.ActiveSubscriptions++
			response.MRREUR += priceCents / 100
		case "trialing":
			response.Trialing++
		case "past_due":
			response.PastDue++
		}
		response.Organisations = append(response.Organisations, item)
	}
	httpx.JSON(w, http.StatusOK, response)
}

type adminBillingEvent struct {
	ID             string    `json:"id"`
	Type           string    `json:"type"`
	OrganisationID int64     `json:"organisation_id"`
	AmountEUR      int64     `json:"amount_eur"`
	CreatedAt      time.Time `json:"created_at"`
}

func (a *App) listAdminBillingEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, event_type, 0::bigint, 0::bigint, created_at
		FROM stripe_events
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load billing events")
		return
	}
	defer rows.Close()

	items := make([]adminBillingEvent, 0)
	for rows.Next() {
		var item adminBillingEvent
		if err := rows.Scan(&item.ID, &item.Type, &item.OrganisationID, &item.AmountEUR, &item.CreatedAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan billing events")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, items)
}

type adminContractsOverview struct {
	TemplatesTotal    int                     `json:"templates_total"`
	InvitesActive     int                     `json:"invites_active"`
	InvitesSigned     int                     `json:"invites_signed"`
	SubmissionsTotal  int                     `json:"submissions_total"`
	LatestSubmissions []adminLatestSubmission `json:"latest_submissions"`
}

type adminLatestSubmission struct {
	ID        int64      `json:"id"`
	InviteID  int64      `json:"invite_id"`
	ClientID  int64      `json:"client_id"`
	Status    string     `json:"status"`
	DateAdded time.Time  `json:"date_added"`
	SignedAt  *time.Time `json:"signed_at,omitempty"`
}

func (a *App) getAdminContractsOverview(w http.ResponseWriter, r *http.Request) {
	db := a.Repo.Connection()
	response := adminContractsOverview{
		TemplatesTotal:   countRows(r.Context(), db, `SELECT count(*) FROM contract_templates WHERE deleted_at IS NULL`),
		InvitesActive:    countRows(r.Context(), db, `SELECT count(*) FROM contract_invites WHERE deleted_at IS NULL AND status IN ('draft', 'sent', 'viewed')`),
		InvitesSigned:    countRows(r.Context(), db, `SELECT count(*) FROM contract_invites WHERE deleted_at IS NULL AND status = 'signed'`),
		SubmissionsTotal: countRows(r.Context(), db, `SELECT count(*) FROM contract_submissions WHERE deleted_at IS NULL`),
	}
	rows, err := db.QueryContext(r.Context(), `
		SELECT id, invite_id, client_id, status, created_at, signed_at
		FROM contract_submissions
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC, id DESC
		LIMIT 10
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load contracts overview")
		return
	}
	defer rows.Close()
	response.LatestSubmissions = make([]adminLatestSubmission, 0)
	for rows.Next() {
		var item adminLatestSubmission
		if err := rows.Scan(&item.ID, &item.InviteID, &item.ClientID, &item.Status, &item.DateAdded, &item.SignedAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan contract submissions")
			return
		}
		response.LatestSubmissions = append(response.LatestSubmissions, item)
	}
	httpx.JSON(w, http.StatusOK, response)
}

type adminNotification struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Kind      string    `json:"kind"`
	DateAdded time.Time `json:"date_added"`
}

func (a *App) listAdminNotifications(w http.ResponseWriter, r *http.Request) {
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, user_id, title, body, COALESCE(type, 'info'), created_at
		FROM notifications
		ORDER BY created_at DESC, id DESC
		LIMIT 100
	`)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load notifications")
		return
	}
	defer rows.Close()
	items := make([]adminNotification, 0)
	for rows.Next() {
		var item adminNotification
		if err := rows.Scan(&item.ID, &item.UserID, &item.Title, &item.Body, &item.Kind, &item.DateAdded); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan notifications")
			return
		}
		items = append(items, item)
	}
	httpx.JSON(w, http.StatusOK, items)
}

type adminBroadcastRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

func (a *App) broadcastAdminNotification(w http.ResponseWriter, r *http.Request) {
	var input adminBroadcastRequest
	if err := httpx.DecodeJSON(r, &input); err != nil || strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Body) == "" {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	result, err := a.Repo.Connection().ExecContext(r.Context(), `
		INSERT INTO notifications (organisation_id, user_id, title, body, type)
		SELECT organisation_id, id, $1, $2, 'platform'
		FROM organisation_memberships
		WHERE deleted_at IS NULL
			AND status = 'active'
	`, strings.TrimSpace(input.Title), strings.TrimSpace(input.Body))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not broadcast notification")
		return
	}
	count, _ := result.RowsAffected()
	httpx.JSON(w, http.StatusAccepted, map[string]string{"message": "Notification sent to " + int64ToString(count) + " users."})
}

type adminSubscriptionPlanResponse struct {
	ID            int64          `json:"id"`
	Slug          string         `json:"slug"`
	Name          string         `json:"name"`
	Price         int            `json:"price"`
	Currency      string         `json:"currency"`
	StripePriceID *string        `json:"stripe_price_id"`
	Limits        map[string]any `json:"limits"`
	Features      []string       `json:"features"`
	CreatedAt     time.Time      `json:"created_at"`
}

type adminSubscriptionPlanRequest struct {
	Slug          string         `json:"slug"`
	Name          string         `json:"name"`
	Price         int            `json:"price"`
	Currency      string         `json:"currency"`
	StripePriceID *string        `json:"stripe_price_id"`
	Limits        map[string]any `json:"limits"`
	Features      []string       `json:"features"`
}

func (a *App) listAdminSubscriptionPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := queryAdminSubscriptionPlans(r.Context(), a.Repo.Connection())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list subscription plans")
		return
	}
	httpx.JSON(w, http.StatusOK, plans)
}

func (a *App) createAdminSubscriptionPlan(w http.ResponseWriter, r *http.Request) {
	var input adminSubscriptionPlanRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.normalize()
	if input.Slug == "" || input.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "slug and name are required")
		return
	}
	limitsJSON, featuresJSON := planJSON(input)
	var id int64
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO subscription_plans (slug, name, price_cents, currency, stripe_price_id, limits_json, features_json)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, input.Slug, input.Name, input.Price*100, input.Currency, stringPtrOrNilValue(input.StripePriceID), limitsJSON, featuresJSON).Scan(&id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create subscription plan")
		return
	}
	plan, err := getAdminSubscriptionPlan(r.Context(), a.Repo.Connection(), id)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load subscription plan")
		return
	}
	httpx.JSON(w, http.StatusCreated, plan)
}

func (a *App) updateAdminSubscriptionPlan(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	var input adminSubscriptionPlanRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	input.normalize()
	if input.Slug == "" || input.Name == "" {
		httpx.Error(w, http.StatusBadRequest, "slug and name are required")
		return
	}
	limitsJSON, featuresJSON := planJSON(input)
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE subscription_plans
		SET slug = $2,
			name = $3,
			price_cents = $4,
			currency = $5,
			stripe_price_id = $6,
			limits_json = $7,
			features_json = $8,
			updated_at = now()
		WHERE id = $1
	`, id, input.Slug, input.Name, input.Price*100, input.Currency, stringPtrOrNilValue(input.StripePriceID), limitsJSON, featuresJSON); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update subscription plan")
		return
	}
	plan, err := getAdminSubscriptionPlan(r.Context(), a.Repo.Connection(), id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "subscription plan not found")
		return
	}
	httpx.JSON(w, http.StatusOK, plan)
}

func (a *App) deleteAdminSubscriptionPlan(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if _, err := a.Repo.Connection().ExecContext(r.Context(), `
		UPDATE subscription_plans
		SET active = false, updated_at = now()
		WHERE id = $1
	`, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete subscription plan")
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]string{"message": "Plan deleted."})
}

func queryAdminSubscriptionPlans(ctx context.Context, db *sql.DB) ([]adminSubscriptionPlanResponse, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, slug, name, price_cents, currency, stripe_price_id, limits_json, features_json, created_at
		FROM subscription_plans
		WHERE active = true
		ORDER BY price_cents ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]adminSubscriptionPlanResponse, 0)
	for rows.Next() {
		item, err := scanAdminSubscriptionPlan(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func getAdminSubscriptionPlan(ctx context.Context, db *sql.DB, id int64) (*adminSubscriptionPlanResponse, error) {
	row := db.QueryRowContext(ctx, `
		SELECT id, slug, name, price_cents, currency, stripe_price_id, limits_json, features_json, created_at
		FROM subscription_plans
		WHERE id = $1
	`)
	item, err := scanAdminSubscriptionPlan(row)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

type subscriptionPlanScanner interface {
	Scan(dest ...any) error
}

func scanAdminSubscriptionPlan(row subscriptionPlanScanner) (adminSubscriptionPlanResponse, error) {
	var item adminSubscriptionPlanResponse
	var priceCents int
	var limitsRaw, featuresRaw models.JSONB
	if err := row.Scan(&item.ID, &item.Slug, &item.Name, &priceCents, &item.Currency, &item.StripePriceID, &limitsRaw, &featuresRaw, &item.CreatedAt); err != nil {
		return item, err
	}
	item.Price = priceCents / 100
	item.Limits = jsonObject(limitsRaw)
	item.Features = featureList(featuresRaw)
	return item, nil
}

func (r *adminSubscriptionPlanRequest) normalize() {
	r.Slug = strings.ToLower(strings.TrimSpace(r.Slug))
	r.Name = strings.TrimSpace(r.Name)
	r.Currency = strings.ToUpper(strings.TrimSpace(r.Currency))
	if r.Currency == "" {
		r.Currency = "EUR"
	}
}

func planJSON(input adminSubscriptionPlanRequest) (models.JSONB, models.JSONB) {
	limitsRaw, _ := json.Marshal(input.Limits)
	features := map[string]bool{}
	for _, feature := range input.Features {
		feature = strings.TrimSpace(feature)
		if feature != "" {
			features[feature] = true
		}
	}
	featuresRaw, _ := json.Marshal(features)
	return limitsRaw, featuresRaw
}

func jsonObject(raw models.JSONB) map[string]any {
	out := map[string]any{}
	if len(raw) == 0 {
		return out
	}
	_ = json.Unmarshal(raw, &out)
	return out
}

func featureList(raw models.JSONB) []string {
	obj := map[string]any{}
	if len(raw) == 0 {
		return []string{}
	}
	if err := json.Unmarshal(raw, &obj); err != nil {
		return []string{}
	}
	out := make([]string, 0, len(obj))
	for key, value := range obj {
		if enabled, ok := value.(bool); !ok || enabled {
			out = append(out, key)
		}
	}
	return out
}

func stringPtrOrNilValue(value *string) *string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	return &trimmed
}

func bytesToMB(bytes int64) int64 {
	if bytes <= 0 {
		return 0
	}
	return (bytes + 1024*1024 - 1) / (1024 * 1024)
}

func int64ToString(value int64) string {
	return strconv.FormatInt(value, 10)
}
