package app

import (
	"backend/internal/platform/httpx"
	"net/http"
	"time"
)

type hrHourRequest struct {
	UserID int64   `json:"user_id"`
	Date   string  `json:"date"`
	Hours  float64 `json:"hours"`
	Note   string  `json:"note"`
}

type hrLeaveRequest struct {
	UserID    int64  `json:"user_id"`
	LeaveType string `json:"leave_type"`
	From      string `json:"from"`
	To        string `json:"to"`
	Status    string `json:"status"`
	Note      string `json:"note"`
}

type hrReviewRequest struct {
	UserID     int64  `json:"user_id"`
	ReviewerID int64  `json:"reviewer_id"`
	Score      int    `json:"score"`
	Summary    string `json:"summary"`
}

type hrCertificateRequest struct {
	Type   string `json:"type"`
	UserID int64  `json:"user_id"`
}

func (a *App) listHRHours(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, user_id, work_date, hours, COALESCE(description, '')
		FROM hr_hours
		WHERE organisation_id = $1
		ORDER BY work_date DESC, id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list HR hours")
		return
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, userID int64
		var date time.Time
		var hours float64
		var note string
		if err := rows.Scan(&id, &userID, &date, &hours, &note); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan HR hours")
			return
		}
		items = append(items, map[string]any{
			"id":      id,
			"user_id": userID,
			"date":    date.Format("2006-01-02"),
			"hours":   hours,
			"note":    note,
		})
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"hours": items})
}

func (a *App) createHRHour(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input hrHourRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	workDate, err := parseDateOnly(input.Date)
	if err != nil || input.Hours <= 0 {
		httpx.Error(w, http.StatusBadRequest, "valid date and hours are required")
		return
	}
	userID := fallbackMembershipID(input.UserID, claims.MembershipID)
	var id int64
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO hr_hours (organisation_id, user_id, work_date, hours, description)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, claims.OrganisationID, userID, workDate, input.Hours, input.Note).Scan(&id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create HR hour")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{
		"id":      id,
		"user_id": userID,
		"date":    workDate.Format("2006-01-02"),
		"hours":   input.Hours,
		"note":    input.Note,
	})
}

func (a *App) listHRLeaves(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, user_id, type, status, starts_on, ends_on, COALESCE(reason, '')
		FROM hr_leaves
		WHERE organisation_id = $1
		ORDER BY starts_on DESC, id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list HR leaves")
		return
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, userID int64
		var leaveType, status, note string
		var from, to time.Time
		if err := rows.Scan(&id, &userID, &leaveType, &status, &from, &to, &note); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan HR leaves")
			return
		}
		items = append(items, hrLeaveResponse(id, userID, leaveType, status, from, to, note))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"leaves": items})
}

func (a *App) createHRLeave(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input hrLeaveRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	from, err := parseDateOnly(input.From)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "valid from date is required")
		return
	}
	to, err := parseDateOnly(input.To)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "valid to date is required")
		return
	}
	userID := fallbackMembershipID(input.UserID, claims.MembershipID)
	status := defaultString(input.Status, "pending")
	var id int64
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO hr_leaves (organisation_id, user_id, type, status, starts_on, ends_on, reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, claims.OrganisationID, userID, input.LeaveType, status, from, to, input.Note).Scan(&id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create HR leave")
		return
	}
	httpx.JSON(w, http.StatusCreated, hrLeaveResponse(id, userID, input.LeaveType, status, from, to, input.Note))
}

func (a *App) listHRReviews(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, user_id, reviewer_user_id, COALESCE(rating, 0), COALESCE(notes, ''), created_at
		FROM hr_reviews
		WHERE organisation_id = $1
		ORDER BY created_at DESC, id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list HR reviews")
		return
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id, userID, reviewerID int64
		var score int
		var summary string
		var createdAt time.Time
		if err := rows.Scan(&id, &userID, &reviewerID, &score, &summary, &createdAt); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan HR reviews")
			return
		}
		items = append(items, hrReviewResponse(id, userID, reviewerID, score, summary, createdAt))
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"reviews": items})
}

func (a *App) createHRReview(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input hrReviewRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	reviewerID := fallbackMembershipID(input.ReviewerID, claims.MembershipID)
	var id int64
	var createdAt time.Time
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO hr_reviews (organisation_id, user_id, reviewer_user_id, rating, notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`, claims.OrganisationID, input.UserID, reviewerID, input.Score, input.Summary).Scan(&id, &createdAt); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create HR review")
		return
	}
	httpx.JSON(w, http.StatusCreated, hrReviewResponse(id, input.UserID, reviewerID, input.Score, input.Summary, createdAt))
}

func (a *App) createHRCertificateRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input hrCertificateRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	userID := fallbackMembershipID(input.UserID, claims.MembershipID)
	var id int64
	if err := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO hr_certificate_requests (organisation_id, user_id, requested_by_id, type)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, claims.OrganisationID, userID, claims.MembershipID, input.Type).Scan(&id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create HR certificate request")
		return
	}
	httpx.JSON(w, http.StatusCreated, map[string]any{"request_id": id})
}

func parseDateOnly(value string) (time.Time, error) {
	return time.Parse("2006-01-02", value)
}

func fallbackMembershipID(input, fallback int64) int64 {
	if input > 0 {
		return input
	}
	return fallback
}

func hrLeaveResponse(id, userID int64, leaveType, status string, from, to time.Time, note string) map[string]any {
	return map[string]any{
		"id":         id,
		"user_id":    userID,
		"leave_type": leaveType,
		"from":       from.Format("2006-01-02"),
		"to":         to.Format("2006-01-02"),
		"status":     status,
		"note":       note,
	}
}

func hrReviewResponse(id, userID, reviewerID int64, score int, summary string, createdAt time.Time) map[string]any {
	return map[string]any{
		"id":          id,
		"user_id":     userID,
		"reviewer_id": reviewerID,
		"score":       score,
		"summary":     summary,
		"date_added":  createdAt.Format(time.RFC3339),
	}
}
