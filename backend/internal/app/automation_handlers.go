package app

import (
	"backend/internal/platform/httpx"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type automationRuleRequest struct {
	Name         *string `json:"name"`
	Trigger      *string `json:"trigger"`
	TriggerValue *int    `json:"trigger_value"`
	Action       *string `json:"action"`
	AppliesTo    *string `json:"applies_to"`
	Enabled      *bool   `json:"enabled"`
}

func (a *App) listAutomationRules(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	rows, err := a.Repo.Connection().QueryContext(r.Context(), `
		SELECT id, name, trigger_type, conditions_json, actions_json, active, last_run_at, affected_count, created_at
		FROM automation_rules
		WHERE organisation_id = $1
			AND deleted_at IS NULL
		ORDER BY created_at DESC, id DESC
	`, claims.OrganisationID)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not list automation rules")
		return
	}
	defer rows.Close()

	rules := make([]map[string]any, 0)
	for rows.Next() {
		rule, err := scanAutomationRule(rows)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not scan automation rules")
			return
		}
		rules = append(rules, rule)
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"rules": rules})
}

func (a *App) createAutomationRule(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	var input automationRuleRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	name := stringValue(input.Name, "")
	trigger := stringValue(input.Trigger, "days_before_deadline")
	action := stringValue(input.Action, "send_notification")
	appliesTo := stringValue(input.AppliesTo, "contracts")
	triggerValue := intValue(input.TriggerValue, 0)
	enabled := boolValue(input.Enabled, true)
	if name == "" {
		httpx.Error(w, http.StatusBadRequest, "name is required")
		return
	}
	conditionsJSON, actionsJSON, err := automationJSON(triggerValue, action, appliesTo)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not encode automation rule")
		return
	}

	row := a.Repo.Connection().QueryRowContext(r.Context(), `
		INSERT INTO automation_rules (
			organisation_id, name, trigger_type, conditions_json, actions_json, active
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, name, trigger_type, conditions_json, actions_json, active, last_run_at, affected_count, created_at
	`, claims.OrganisationID, name, trigger, conditionsJSON, actionsJSON, enabled)
	rule, err := scanAutomationRule(row)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create automation rule")
		return
	}
	httpx.JSON(w, http.StatusCreated, rule)
}

func (a *App) updateAutomationRule(w http.ResponseWriter, r *http.Request) {
	claims, ok := accountClaims(w, r)
	if !ok {
		return
	}
	id, err := pathID(r, "id")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	current, err := getAutomationRuleParts(r, a, claims.OrganisationID, id)
	if err != nil {
		httpx.Error(w, http.StatusNotFound, "automation rule not found")
		return
	}
	var input automationRuleRequest
	if err := httpx.DecodeJSON(r, &input); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	name := stringValue(input.Name, current.Name)
	trigger := stringValue(input.Trigger, current.Trigger)
	action := stringValue(input.Action, current.Action)
	appliesTo := stringValue(input.AppliesTo, current.AppliesTo)
	triggerValue := intValue(input.TriggerValue, current.TriggerValue)
	enabled := boolValue(input.Enabled, current.Enabled)
	conditionsJSON, actionsJSON, err := automationJSON(triggerValue, action, appliesTo)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not encode automation rule")
		return
	}

	row := a.Repo.Connection().QueryRowContext(r.Context(), `
		UPDATE automation_rules
		SET name = $3,
			trigger_type = $4,
			conditions_json = $5,
			actions_json = $6,
			active = $7,
			updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
		RETURNING id, name, trigger_type, conditions_json, actions_json, active, last_run_at, affected_count, created_at
	`, claims.OrganisationID, id, name, trigger, conditionsJSON, actionsJSON, enabled)
	rule, err := scanAutomationRule(row)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not update automation rule")
		return
	}
	httpx.JSON(w, http.StatusOK, rule)
}

func (a *App) deleteAutomationRule(w http.ResponseWriter, r *http.Request) {
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
		UPDATE automation_rules
		SET deleted_at = now(), updated_at = now()
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, claims.OrganisationID, id); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not delete automation rule")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Automation rule deleted."})
}

type automationRuleParts struct {
	Name         string
	Trigger      string
	TriggerValue int
	Action       string
	AppliesTo    string
	Enabled      bool
}

func getAutomationRuleParts(r *http.Request, a *App, organisationID, id int64) (automationRuleParts, error) {
	row := a.Repo.Connection().QueryRowContext(r.Context(), `
		SELECT name, trigger_type, conditions_json, actions_json, active
		FROM automation_rules
		WHERE organisation_id = $1
			AND id = $2
			AND deleted_at IS NULL
	`, organisationID, id)
	var name, trigger string
	var conditions, actions json.RawMessage
	var enabled bool
	if err := row.Scan(&name, &trigger, &conditions, &actions, &enabled); err != nil {
		return automationRuleParts{}, err
	}
	triggerValue, appliesTo, action := parseAutomationJSON(conditions, actions)
	return automationRuleParts{
		Name:         name,
		Trigger:      trigger,
		TriggerValue: triggerValue,
		Action:       action,
		AppliesTo:    appliesTo,
		Enabled:      enabled,
	}, nil
}

type automationScanner interface {
	Scan(dest ...any) error
}

func scanAutomationRule(row automationScanner) (map[string]any, error) {
	var id int64
	var name, trigger string
	var conditions, actions json.RawMessage
	var enabled bool
	var lastRun sql.NullTime
	var affectedCount int
	var createdAt time.Time
	if err := row.Scan(&id, &name, &trigger, &conditions, &actions, &enabled, &lastRun, &affectedCount, &createdAt); err != nil {
		return nil, err
	}
	triggerValue, appliesTo, action := parseAutomationJSON(conditions, actions)
	out := map[string]any{
		"id":             id,
		"name":           name,
		"trigger":        trigger,
		"trigger_value":  triggerValue,
		"action":         action,
		"applies_to":     appliesTo,
		"enabled":        enabled,
		"created_at":     createdAt.Format(time.RFC3339),
		"affected_count": affectedCount,
	}
	if lastRun.Valid {
		out["last_run"] = lastRun.Time.Format(time.RFC3339)
	}
	return out, nil
}

func automationJSON(triggerValue int, action, appliesTo string) (json.RawMessage, json.RawMessage, error) {
	conditions, err := json.Marshal(map[string]any{
		"trigger_value": triggerValue,
		"applies_to":    appliesTo,
	})
	if err != nil {
		return nil, nil, err
	}
	actions, err := json.Marshal([]map[string]any{
		{"type": action},
	})
	if err != nil {
		return nil, nil, err
	}
	return json.RawMessage(conditions), json.RawMessage(actions), nil
}

func parseAutomationJSON(conditions, actions json.RawMessage) (int, string, string) {
	var conditionData struct {
		TriggerValue int    `json:"trigger_value"`
		AppliesTo    string `json:"applies_to"`
	}
	_ = json.Unmarshal(conditions, &conditionData)
	var actionData []struct {
		Type string `json:"type"`
	}
	_ = json.Unmarshal(actions, &actionData)
	action := "send_notification"
	if len(actionData) > 0 && actionData[0].Type != "" {
		action = actionData[0].Type
	}
	appliesTo := defaultString(conditionData.AppliesTo, "contracts")
	return conditionData.TriggerValue, appliesTo, action
}

func stringValue(value *string, fallback string) string {
	if value == nil {
		return fallback
	}
	return *value
}

func intValue(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func boolValue(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}
