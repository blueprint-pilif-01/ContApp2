-- +goose Up
-- ContApp migration 001: core schema for the first implementation phase.
--
-- Scope:
-- - organisations
-- - global accounts + organisation memberships
-- - RBAC
-- - billing and effective entitlements
-- - base workspace
-- - Contracts Pro
-- - Ticketing Pro
-- - documents, audit, jobs
--
-- Future extension tables remain documented in DBML and will be added by
-- later package-specific migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE admins (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX admins_email_unique
  ON admins (lower(email));

CREATE TABLE organisations (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  cui text,
  address text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX organisations_cui_unique
  ON organisations (cui)
  WHERE cui IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE organisation_settings (
  organisation_id bigint PRIMARY KEY REFERENCES organisations(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE employee_categories (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX employee_categories_org_name_unique
  ON employee_categories (organisation_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE accounts (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX accounts_email_unique
  ON accounts (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX accounts_status_idx
  ON accounts (status);

CREATE TABLE organisation_memberships (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  account_id bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_category_id bigint REFERENCES employee_categories(id) ON DELETE SET NULL,
  display_name text,
  job_title text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  invited_by_membership_id bigint,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT organisation_memberships_invited_by_fk
    FOREIGN KEY (invited_by_membership_id)
    REFERENCES organisation_memberships(id)
    ON DELETE SET NULL
);

CREATE UNIQUE INDEX organisation_memberships_account_unique
  ON organisation_memberships (organisation_id, account_id)
  WHERE deleted_at IS NULL;

CREATE INDEX organisation_memberships_org_status_idx
  ON organisation_memberships (organisation_id, status);

CREATE INDEX organisation_memberships_account_status_idx
  ON organisation_memberships (account_id, status);

CREATE TABLE roles (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX roles_org_slug_unique
  ON roles (organisation_id, slug);

CREATE TABLE permissions (
  id bigserial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  description text
);

CREATE TABLE role_permissions (
  role_id bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id bigint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE membership_roles (
  membership_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  role_id bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (membership_id, role_id)
);

CREATE TABLE refresh_sessions (
  id bigserial PRIMARY KEY,
  jti text NOT NULL UNIQUE,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'account')),
  subject_id bigint NOT NULL,
  active_organisation_id bigint REFERENCES organisations(id) ON DELETE SET NULL,
  active_membership_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX refresh_sessions_subject_idx
  ON refresh_sessions (actor_type, subject_id);

CREATE TABLE subscription_plans (
  id bigserial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  plan_kind text NOT NULL DEFAULT 'base'
    CHECK (plan_kind IN ('base', 'extension', 'bundle', 'custom')),
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  stripe_price_id text UNIQUE,
  limits_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  features_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_definitions (
  id bigserial PRIMARY KEY,
  feature_key text NOT NULL UNIQUE,
  name text NOT NULL,
  package_name text NOT NULL,
  category text NOT NULL DEFAULT 'extension'
    CHECK (category IN ('base', 'extension', 'future')),
  description text,
  default_limits_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plan_features (
  subscription_plan_id bigint NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_definition_id bigint NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
  limits_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (subscription_plan_id, feature_definition_id)
);

CREATE TABLE subscriptions (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  subscription_plan_id bigint NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  stripe_subscription_id text UNIQUE,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_org_status_idx
  ON subscriptions (organisation_id, status);

CREATE TABLE organisation_features (
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  feature_definition_id bigint NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'subscription'
    CHECK (source IN ('subscription', 'manual', 'trial', 'custom')),
  starts_at timestamptz,
  expires_at timestamptz,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id, feature_definition_id)
);

CREATE INDEX organisation_features_feature_enabled_idx
  ON organisation_features (feature_definition_id, enabled);

CREATE TABLE organisation_feature_limits (
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  feature_definition_id bigint NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
  limit_key text NOT NULL,
  limit_value bigint NOT NULL CHECK (limit_value >= 0),
  period text NOT NULL DEFAULT 'none'
    CHECK (period IN ('none', 'monthly', 'yearly')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id, feature_definition_id, limit_key)
);

CREATE TABLE usage_counters (
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  metric text NOT NULL,
  value bigint NOT NULL DEFAULT 0 CHECK (value >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id, period_start, metric)
);

CREATE TABLE stripe_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_user_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  client_type text NOT NULL DEFAULT 'person'
    CHECK (client_type IN ('person', 'company')),
  first_name text,
  last_name text,
  cnp text,
  company_name text,
  cui text,
  tva boolean NOT NULL DEFAULT false,
  responsible_name text,
  responsible_email text,
  email text,
  phone text,
  address text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX clients_org_email_unique
  ON clients (organisation_id, lower(email))
  WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX clients_org_cnp_unique
  ON clients (organisation_id, cnp)
  WHERE cnp IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX clients_org_cui_unique
  ON clients (organisation_id, cui)
  WHERE cui IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX clients_org_person_search_idx
  ON clients (organisation_id, last_name, first_name)
  WHERE deleted_at IS NULL;

CREATE INDEX clients_org_company_search_idx
  ON clients (organisation_id, company_name)
  WHERE deleted_at IS NULL;

CREATE TABLE files (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  uploaded_by_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  storage_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX files_org_category_idx
  ON files (organisation_id, category, created_at DESC);

CREATE TABLE organisation_documents (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  file_id bigint NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  uploaded_by_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  document_name text NOT NULL,
  document_type text,
  visibility text NOT NULL DEFAULT 'organisation'
    CHECK (visibility IN ('organisation', 'restricted')),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX organisation_documents_type_idx
  ON organisation_documents (organisation_id, document_type, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE client_documents (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_id bigint NOT NULL REFERENCES files(id) ON DELETE RESTRICT,
  document_name text NOT NULL,
  file_type text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  expiration_date timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX client_documents_client_idx
  ON client_documents (organisation_id, client_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE signatures (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_user_id bigint REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_id bigint REFERENCES files(id) ON DELETE SET NULL,
  signature_png bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX signatures_owner_idx
  ON signatures (organisation_id, owner_user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE contract_templates (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  name text NOT NULL,
  contract_type text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX contract_templates_org_idx
  ON contract_templates (organisation_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX contract_templates_status_idx
  ON contract_templates (organisation_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE contract_invites (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  template_id bigint NOT NULL REFERENCES contract_templates(id) ON DELETE RESTRICT,
  client_id bigint NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  created_by_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'expired', 'revoked')),
  remarks text,
  expiration_date timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  revoked_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX contract_invites_org_status_idx
  ON contract_invites (organisation_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX contract_invites_expiration_idx
  ON contract_invites (expiration_date)
  WHERE status IN ('draft', 'sent', 'viewed') AND deleted_at IS NULL;

CREATE TABLE contract_submissions (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  invite_id bigint NOT NULL UNIQUE REFERENCES contract_invites(id) ON DELETE RESTRICT,
  template_id bigint NOT NULL REFERENCES contract_templates(id) ON DELETE RESTRICT,
  client_id bigint NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  filled_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature_image bytea,
  contract_number text,
  pdf_file_id bigint REFERENCES files(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'signed'
    CHECK (status IN ('signed', 'voided')),
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX contract_submissions_org_number_unique
  ON contract_submissions (organisation_id, contract_number)
  WHERE contract_number IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX contract_submissions_org_idx
  ON contract_submissions (organisation_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE contract_numbers (
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  year integer NOT NULL CHECK (year >= 2000),
  last_number integer NOT NULL DEFAULT 0 CHECK (last_number >= 0),
  PRIMARY KEY (organisation_id, year)
);

CREATE TABLE workspace_notes (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  client_id bigint REFERENCES clients(id) ON DELETE SET NULL,
  visibility text NOT NULL DEFAULT 'personal'
    CHECK (visibility IN ('personal', 'shared')),
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX workspace_notes_visibility_idx
  ON workspace_notes (organisation_id, visibility, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX workspace_notes_owner_idx
  ON workspace_notes (organisation_id, owner_user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE notebook_documents (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  folder text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX notebook_documents_owner_idx
  ON notebook_documents (organisation_id, owner_user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE planner_events (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  owner_user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  client_id bigint REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('contract', 'ticket', 'meeting', 'reminder', 'hr', 'custom')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  source_type text,
  source_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX planner_events_org_time_idx
  ON planner_events (organisation_id, starts_at)
  WHERE deleted_at IS NULL;

CREATE INDEX planner_events_owner_time_idx
  ON planner_events (organisation_id, owner_user_id, starts_at)
  WHERE deleted_at IS NULL;

CREATE TABLE notifications (
  id bigserial PRIMARY KEY,
  organisation_id bigint REFERENCES organisations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx
  ON notifications (user_id, created_at DESC);

CREATE INDEX notifications_unread_idx
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE ticketing_tasks (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_by_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  assignee_user_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  client_id bigint REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'archived')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source_type text CHECK (source_type IS NULL OR source_type IN ('manual', 'chat', 'ai', 'client', 'contract')),
  source_id bigint,
  due_at timestamptz,
  claimed_at timestamptz,
  completed_at timestamptz,
  refused_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX ticketing_tasks_pipeline_idx
  ON ticketing_tasks (organisation_id, status, priority, due_at)
  WHERE deleted_at IS NULL;

CREATE INDEX ticketing_tasks_assignee_idx
  ON ticketing_tasks (organisation_id, assignee_user_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE events (
  id bigserial PRIMARY KEY,
  organisation_id bigint REFERENCES organisations(id) ON DELETE SET NULL,
  actor_type text,
  actor_id bigint,
  event_type text NOT NULL,
  entity_type text,
  entity_id bigint,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_org_created_idx
  ON events (organisation_id, created_at DESC);

CREATE TABLE job_runs (
  id bigserial PRIMARY KEY,
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX job_runs_name_started_idx
  ON job_runs (job_name, started_at DESC);

-- +goose Down
DROP TABLE IF EXISTS job_runs;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS ticketing_tasks;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS planner_events;
DROP TABLE IF EXISTS notebook_documents;
DROP TABLE IF EXISTS workspace_notes;
DROP TABLE IF EXISTS contract_numbers;
DROP TABLE IF EXISTS contract_submissions;
DROP TABLE IF EXISTS contract_invites;
DROP TABLE IF EXISTS contract_templates;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS client_documents;
DROP TABLE IF EXISTS organisation_documents;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS stripe_events;
DROP TABLE IF EXISTS usage_counters;
DROP TABLE IF EXISTS organisation_feature_limits;
DROP TABLE IF EXISTS organisation_features;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plan_features;
DROP TABLE IF EXISTS feature_definitions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS refresh_sessions;
DROP TABLE IF EXISTS membership_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS organisation_memberships;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS employee_categories;
DROP TABLE IF EXISTS organisation_settings;
DROP TABLE IF EXISTS organisations;
DROP TABLE IF EXISTS admins;
