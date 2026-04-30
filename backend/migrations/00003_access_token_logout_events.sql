-- +goose Up
CREATE TABLE access_token_logout_events (
  id bigserial PRIMARY KEY,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'account')),
  subject_id bigint NOT NULL,
  organisation_id bigint REFERENCES organisations(id) ON DELETE SET NULL,
  membership_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  logged_out_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX access_token_logout_events_subject_idx
  ON access_token_logout_events (actor_type, subject_id, logged_out_at DESC);

-- +goose Down
DROP TABLE IF EXISTS access_token_logout_events;
