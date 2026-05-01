-- +goose Up
CREATE TABLE IF NOT EXISTS hr_hours (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  hours numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_hours_user_date_idx
  ON hr_hours (organisation_id, user_id, work_date);

CREATE TABLE IF NOT EXISTS hr_leaves (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('odihna', 'medical', 'sabatic', 'maternal')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  reason text,
  reviewed_by_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_leaves_user_period_idx
  ON hr_leaves (organisation_id, user_id, starts_on);

CREATE INDEX IF NOT EXISTS hr_leaves_status_idx
  ON hr_leaves (organisation_id, status, starts_on);

CREATE TABLE IF NOT EXISTS hr_reviews (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  reviewer_user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  period_start date,
  period_end date,
  rating integer,
  notes text,
  review_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hr_reviews_user_idx
  ON hr_reviews (organisation_id, user_id, created_at);

CREATE TABLE IF NOT EXISTS hr_certificate_requests (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  requested_by_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('employee_certificate', 'income_certificate')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'rejected')),
  file_id bigint REFERENCES files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS hr_certificate_requests_user_idx
  ON hr_certificate_requests (organisation_id, user_id, created_at);

CREATE INDEX IF NOT EXISTS hr_certificate_requests_status_idx
  ON hr_certificate_requests (organisation_id, status, created_at);

INSERT INTO feature_definitions (
  feature_key,
  name,
  package_name,
  category,
  description,
  default_limits_json
)
VALUES (
  'hr',
  'HR Pro',
  'HR Package',
  'extension',
  'Time tracking, leave requests, reviews, and certificate requests.',
  '{}'::jsonb
)
ON CONFLICT (feature_key) DO UPDATE
SET
  name = EXCLUDED.name,
  package_name = EXCLUDED.package_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  default_limits_json = EXCLUDED.default_limits_json,
  active = true,
  updated_at = now();

-- +goose Down
DROP TABLE IF EXISTS hr_certificate_requests;
DROP TABLE IF EXISTS hr_reviews;
DROP TABLE IF EXISTS hr_leaves;
DROP TABLE IF EXISTS hr_hours;
