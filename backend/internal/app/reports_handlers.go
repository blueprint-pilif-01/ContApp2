package app

import (
	"backend/internal/platform/httpx"
	"database/sql"
	"net/http"
	"time"
)

type trendRow struct {
	Month string `json:"month"`
}

type clientsTrendRow struct {
	Month string `json:"month"`
	Total int64  `json:"total"`
	New   int64  `json:"new"`
}

type tasksTrendRow struct {
	Month     string `json:"month"`
	Created   int64  `json:"created"`
	Completed int64  `json:"completed"`
}

type contractsTrendRow struct {
	Month   string `json:"month"`
	Sent    int64  `json:"sent"`
	Signed  int64  `json:"signed"`
	Expired int64  `json:"expired"`
}

type teamProductivityRow struct {
	UserID         int64   `json:"user_id"`
	Name           string  `json:"name"`
	TasksCompleted int64   `json:"tasks_completed"`
	AvgTimeHours   float64 `json:"avg_time_hours"`
}

func (a *App) getReportsOverview(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	db := a.Repo.Connection()
	months := lastSixMonthStarts()

	clients, err := reportClientsTrend(r, db, claims.OrganisationID, months)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load clients report")
		return
	}
	tasks, err := reportTasksTrend(r, db, claims.OrganisationID, months)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load tasks report")
		return
	}
	contracts, err := reportContractsTrend(r, db, claims.OrganisationID, months)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load contracts report")
		return
	}
	productivity, err := reportTeamProductivity(r, db, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not load productivity report")
		return
	}

	httpx.JSON(w, http.StatusOK, map[string]any{
		"data": map[string]any{
			"clients_trend":     clients,
			"tasks_trend":       tasks,
			"contracts_trend":   contracts,
			"team_productivity": productivity,
		},
	})
}

func reportClientsTrend(r *http.Request, db *sql.DB, organisationID int64, months []time.Time) ([]clientsTrendRow, error) {
	rows, err := db.QueryContext(r.Context(), `
		WITH months AS (
			SELECT generate_series($2::date, $3::date, interval '1 month')::date AS month_start
		)
		SELECT
			to_char(m.month_start, 'Mon') AS month_label,
			(
				SELECT count(*)
				FROM clients c
				WHERE c.organisation_id = $1
					AND c.deleted_at IS NULL
					AND c.created_at < (m.month_start + interval '1 month')
			) AS total_clients,
			count(c.id) AS new_clients
		FROM months m
		LEFT JOIN clients c ON c.organisation_id = $1
			AND c.deleted_at IS NULL
			AND date_trunc('month', c.created_at)::date = m.month_start
		GROUP BY m.month_start
		ORDER BY m.month_start
	`, organisationID, months[0], months[len(months)-1])
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]clientsTrendRow, 0, len(months))
	for rows.Next() {
		var row clientsTrendRow
		if err := rows.Scan(&row.Month, &row.Total, &row.New); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func reportTasksTrend(r *http.Request, db *sql.DB, organisationID int64, months []time.Time) ([]tasksTrendRow, error) {
	rows, err := db.QueryContext(r.Context(), `
		WITH months AS (
			SELECT generate_series($2::date, $3::date, interval '1 month')::date AS month_start
		)
		SELECT
			to_char(m.month_start, 'Mon') AS month_label,
			count(t.id) AS created,
			count(t.id) FILTER (WHERE t.status IN ('done', 'closed')) AS completed
		FROM months m
		LEFT JOIN ticketing_tasks t ON t.organisation_id = $1
			AND t.deleted_at IS NULL
			AND date_trunc('month', t.created_at)::date = m.month_start
		GROUP BY m.month_start
		ORDER BY m.month_start
	`, organisationID, months[0], months[len(months)-1])
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]tasksTrendRow, 0, len(months))
	for rows.Next() {
		var row tasksTrendRow
		if err := rows.Scan(&row.Month, &row.Created, &row.Completed); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func reportContractsTrend(r *http.Request, db *sql.DB, organisationID int64, months []time.Time) ([]contractsTrendRow, error) {
	rows, err := db.QueryContext(r.Context(), `
		WITH months AS (
			SELECT generate_series($2::date, $3::date, interval '1 month')::date AS month_start
		)
		SELECT
			to_char(m.month_start, 'Mon') AS month_label,
			count(i.id) AS sent,
			count(s.id) AS signed,
			count(i.id) FILTER (
				WHERE i.expiration_date IS NOT NULL
					AND i.expiration_date < now()
					AND i.status NOT IN ('signed', 'revoked')
			) AS expired
		FROM months m
		LEFT JOIN contract_invites i ON i.organisation_id = $1
			AND i.deleted_at IS NULL
			AND date_trunc('month', i.created_at)::date = m.month_start
		LEFT JOIN contract_submissions s ON s.organisation_id = $1
			AND s.deleted_at IS NULL
			AND date_trunc('month', s.created_at)::date = m.month_start
		GROUP BY m.month_start
		ORDER BY m.month_start
	`, organisationID, months[0], months[len(months)-1])
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]contractsTrendRow, 0, len(months))
	for rows.Next() {
		var row contractsTrendRow
		if err := rows.Scan(&row.Month, &row.Sent, &row.Signed, &row.Expired); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func reportTeamProductivity(r *http.Request, db *sql.DB, organisationID int64) ([]teamProductivityRow, error) {
	rows, err := db.QueryContext(r.Context(), `
		SELECT
			m.id,
			COALESCE(NULLIF(trim(a.first_name || ' ' || a.last_name), ''), a.email) AS name,
			count(t.id) FILTER (WHERE t.status IN ('done', 'closed')) AS tasks_completed,
			0::float8 AS avg_time_hours
		FROM organisation_memberships m
		JOIN accounts a ON a.id = m.account_id
		LEFT JOIN ticketing_tasks t ON t.organisation_id = m.organisation_id
			AND t.assignee_user_id = m.id
			AND t.deleted_at IS NULL
		WHERE m.organisation_id = $1
			AND m.deleted_at IS NULL
		GROUP BY m.id, a.first_name, a.last_name, a.email
		ORDER BY tasks_completed DESC, m.id ASC
		LIMIT 8
	`, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]teamProductivityRow, 0)
	for rows.Next() {
		var row teamProductivityRow
		if err := rows.Scan(&row.UserID, &row.Name, &row.TasksCompleted, &row.AvgTimeHours); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func lastSixMonthStarts() []time.Time {
	now := time.Now().UTC()
	currentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	months := make([]time.Time, 0, 6)
	for i := 5; i >= 0; i-- {
		months = append(months, currentMonth.AddDate(0, -i, 0))
	}
	return months
}
