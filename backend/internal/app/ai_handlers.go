package app

import (
	"backend/internal/platform/httpx"
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"
)

func (a *App) suggestAIWorkflows(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}

	db := a.Repo.Connection()
	ctx := r.Context()
	now := time.Now().UTC()
	suggestions := make([]map[string]any, 0, 3)

	automationRules := countOrganisationRows(ctx, db, `
		SELECT count(*)
		FROM automation_rules
		WHERE organisation_id = $1
			AND deleted_at IS NULL
	`, claims.OrganisationID)
	contractInvites := countOrganisationRows(ctx, db, `
		SELECT count(*)
		FROM contract_invites
		WHERE organisation_id = $1
			AND deleted_at IS NULL
	`, claims.OrganisationID)
	ticketingTasks := countOrganisationRows(ctx, db, `
		SELECT count(*)
		FROM ticketing_tasks
		WHERE organisation_id = $1
			AND deleted_at IS NULL
	`, claims.OrganisationID)

	if automationRules == 0 {
		suggestions = append(suggestions, aiWorkflowSuggestion(
			"contract-deadline-reminders",
			"Contract deadline reminders",
			"No automation rules exist yet. Start with deadline reminders so contract follow-up is not manual.",
			"Contract deadline reminders",
			"Notify the workspace before contract deadlines.",
			"days_before_deadline",
			"contracts",
			[]map[string]any{
				{
					"id":     "notify-owner",
					"kind":   "action",
					"type":   "send_notification",
					"config": map[string]any{"message": "Contract deadline is approaching"},
				},
			},
			now,
		))
	}

	if contractInvites > 0 {
		suggestions = append(suggestions, aiWorkflowSuggestion(
			"contract-submission-summary",
			"Summarize signed contract submissions",
			fmt.Sprintf("%d contract invite records are available. Summaries can reduce manual review time.", contractInvites),
			"Summarize signed contract submissions",
			"Generate an internal summary after a contract submission changes status.",
			"on_status_change",
			"contracts",
			[]map[string]any{
				{
					"id":     "summarize-contract",
					"kind":   "ai",
					"action": "ai_summarize",
					"config": map[string]any{"source": "contract_submission"},
				},
				{
					"id":     "post-summary",
					"kind":   "action",
					"type":   "post_chat_message",
					"config": map[string]any{"channel": "contracts"},
				},
			},
			now,
		))
	}

	if ticketingTasks > 0 {
		suggestions = append(suggestions, aiWorkflowSuggestion(
			"ticket-assignee-suggestion",
			"Suggest assignees for new tickets",
			fmt.Sprintf("%d ticketing records are available. Assignment suggestions can help route new work faster.", ticketingTasks),
			"Suggest assignees for new tickets",
			"Use ticket context to recommend an assignee when a task is created.",
			"on_create",
			"tasks",
			[]map[string]any{
				{
					"id":     "suggest-assignee",
					"kind":   "ai",
					"action": "ai_suggest_assignee",
					"config": map[string]any{"source": "ticket"},
				},
				{
					"id":     "notify-team",
					"kind":   "action",
					"type":   "send_notification",
					"config": map[string]any{"message": "AI suggested an assignee"},
				},
			},
			now,
		))
	}

	httpx.JSON(w, http.StatusOK, map[string]any{"suggestions": suggestions})
}

func aiWorkflowSuggestion(id, name, rationale, workflowName, description, triggerKind, entity string, steps []map[string]any, now time.Time) map[string]any {
	timestamp := now.Format(time.RFC3339)
	return map[string]any{
		"id":        id,
		"name":      name,
		"rationale": rationale,
		"workflow": map[string]any{
			"id":          "ai-" + id,
			"name":        workflowName,
			"description": description,
			"enabled":     false,
			"trigger": map[string]any{
				"kind":   triggerKind,
				"entity": entity,
				"config": map[string]any{},
			},
			"steps":      steps,
			"tags":       []string{"ai", "suggested"},
			"created_at": timestamp,
			"updated_at": timestamp,
			"source":     "ai_generated",
		},
	}
}

func countOrganisationRows(ctx context.Context, db *sql.DB, query string, organisationID int64) int {
	var count int
	if err := db.QueryRowContext(ctx, query, organisationID).Scan(&count); err != nil {
		return 0
	}
	return count
}
