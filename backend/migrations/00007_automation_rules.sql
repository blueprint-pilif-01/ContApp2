-- +goose Up
CREATE TABLE IF NOT EXISTS automation_rules (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  conditions_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  affected_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS automation_rules_trigger_idx
  ON automation_rules (organisation_id, active, trigger_type)
  WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS automation_rules;
