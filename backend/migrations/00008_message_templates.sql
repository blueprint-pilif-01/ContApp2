-- +goose Up
CREATE TABLE IF NOT EXISTS message_templates (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS message_templates_org_category_idx
  ON message_templates (organisation_id, category, created_at)
  WHERE deleted_at IS NULL;

-- +goose Down
DROP TABLE IF EXISTS message_templates;
