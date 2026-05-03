-- ContApp2 database schema snapshot generated from the current local PostgreSQL database.
--
-- Generated on 2026-05-03 after applying migrations through version 9.
-- Includes schema and migration tracking rows only. Demo/current application
-- data has intentionally been excluded.
--
-- This file is intended as a review/restore snapshot. The normal Docker
-- bootstrap file remains backend/configs/init.sql.

--
-- PostgreSQL database dump
--

\restrict JjllxlrQrYhAkOVBttz3pvKw4gwqa1OUPtMpZzpGzGreobFfM73NurvJjh17HKo

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.workspace_notes DROP CONSTRAINT IF EXISTS workspace_notes_owner_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workspace_notes DROP CONSTRAINT IF EXISTS workspace_notes_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.workspace_notes DROP CONSTRAINT IF EXISTS workspace_notes_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.usage_counters DROP CONSTRAINT IF EXISTS usage_counters_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticketing_tasks DROP CONSTRAINT IF EXISTS ticketing_tasks_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticketing_tasks DROP CONSTRAINT IF EXISTS ticketing_tasks_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticketing_tasks DROP CONSTRAINT IF EXISTS ticketing_tasks_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticketing_tasks DROP CONSTRAINT IF EXISTS ticketing_tasks_assignee_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_owner_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_file_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS refresh_sessions_active_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS refresh_sessions_active_membership_id_fkey;
ALTER TABLE IF EXISTS ONLY public.planner_events DROP CONSTRAINT IF EXISTS planner_events_owner_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.planner_events DROP CONSTRAINT IF EXISTS planner_events_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.planner_events DROP CONSTRAINT IF EXISTS planner_events_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plan_features DROP CONSTRAINT IF EXISTS plan_features_subscription_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plan_features DROP CONSTRAINT IF EXISTS plan_features_feature_definition_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_settings DROP CONSTRAINT IF EXISTS organisation_settings_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_memberships DROP CONSTRAINT IF EXISTS organisation_memberships_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_memberships DROP CONSTRAINT IF EXISTS organisation_memberships_invited_by_fk;
ALTER TABLE IF EXISTS ONLY public.organisation_memberships DROP CONSTRAINT IF EXISTS organisation_memberships_employee_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_memberships DROP CONSTRAINT IF EXISTS organisation_memberships_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_features DROP CONSTRAINT IF EXISTS organisation_features_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_features DROP CONSTRAINT IF EXISTS organisation_features_feature_definition_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_feature_limits DROP CONSTRAINT IF EXISTS organisation_feature_limits_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_feature_limits DROP CONSTRAINT IF EXISTS organisation_feature_limits_feature_definition_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_documents DROP CONSTRAINT IF EXISTS organisation_documents_uploaded_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_documents DROP CONSTRAINT IF EXISTS organisation_documents_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.organisation_documents DROP CONSTRAINT IF EXISTS organisation_documents_file_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notebook_documents DROP CONSTRAINT IF EXISTS notebook_documents_owner_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notebook_documents DROP CONSTRAINT IF EXISTS notebook_documents_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_templates DROP CONSTRAINT IF EXISTS message_templates_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_templates DROP CONSTRAINT IF EXISTS message_templates_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.membership_roles DROP CONSTRAINT IF EXISTS membership_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.membership_roles DROP CONSTRAINT IF EXISTS membership_roles_membership_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_reviews DROP CONSTRAINT IF EXISTS hr_reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_reviews DROP CONSTRAINT IF EXISTS hr_reviews_reviewer_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_reviews DROP CONSTRAINT IF EXISTS hr_reviews_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_reviewed_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_hours DROP CONSTRAINT IF EXISTS hr_hours_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_hours DROP CONSTRAINT IF EXISTS hr_hours_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_hours DROP CONSTRAINT IF EXISTS hr_hours_approved_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificate_requests DROP CONSTRAINT IF EXISTS hr_certificate_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificate_requests DROP CONSTRAINT IF EXISTS hr_certificate_requests_requested_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificate_requests DROP CONSTRAINT IF EXISTS hr_certificate_requests_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificate_requests DROP CONSTRAINT IF EXISTS hr_certificate_requests_file_id_fkey;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_uploaded_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employee_categories DROP CONSTRAINT IF EXISTS employee_categories_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_pdf_file_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_invite_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_numbers DROP CONSTRAINT IF EXISTS contract_numbers_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_owner_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.client_documents DROP CONSTRAINT IF EXISTS client_documents_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.client_documents DROP CONSTRAINT IF EXISTS client_documents_file_id_fkey;
ALTER TABLE IF EXISTS ONLY public.client_documents DROP CONSTRAINT IF EXISTS client_documents_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_participants DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_participants DROP CONSTRAINT IF EXISTS chat_participants_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_derived_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.automation_rules DROP CONSTRAINT IF EXISTS automation_rules_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_token_logout_events DROP CONSTRAINT IF EXISTS access_token_logout_events_organisation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_token_logout_events DROP CONSTRAINT IF EXISTS access_token_logout_events_membership_id_fkey;
DROP INDEX IF EXISTS public.workspace_notes_visibility_idx;
DROP INDEX IF EXISTS public.workspace_notes_owner_idx;
DROP INDEX IF EXISTS public.ticketing_tasks_pipeline_idx;
DROP INDEX IF EXISTS public.ticketing_tasks_assignee_idx;
DROP INDEX IF EXISTS public.subscriptions_org_status_idx;
DROP INDEX IF EXISTS public.signatures_owner_idx;
DROP INDEX IF EXISTS public.roles_org_slug_unique;
DROP INDEX IF EXISTS public.refresh_sessions_subject_idx;
DROP INDEX IF EXISTS public.planner_events_owner_time_idx;
DROP INDEX IF EXISTS public.planner_events_org_time_idx;
DROP INDEX IF EXISTS public.organisations_cui_unique;
DROP INDEX IF EXISTS public.organisation_memberships_org_status_idx;
DROP INDEX IF EXISTS public.organisation_memberships_account_unique;
DROP INDEX IF EXISTS public.organisation_memberships_account_status_idx;
DROP INDEX IF EXISTS public.organisation_features_feature_enabled_idx;
DROP INDEX IF EXISTS public.organisation_documents_type_idx;
DROP INDEX IF EXISTS public.notifications_user_created_idx;
DROP INDEX IF EXISTS public.notifications_unread_idx;
DROP INDEX IF EXISTS public.notebook_documents_owner_idx;
DROP INDEX IF EXISTS public.message_templates_org_category_idx;
DROP INDEX IF EXISTS public.job_runs_name_started_idx;
DROP INDEX IF EXISTS public.hr_reviews_user_idx;
DROP INDEX IF EXISTS public.hr_leaves_user_period_idx;
DROP INDEX IF EXISTS public.hr_leaves_status_idx;
DROP INDEX IF EXISTS public.hr_hours_user_date_idx;
DROP INDEX IF EXISTS public.hr_certificate_requests_user_idx;
DROP INDEX IF EXISTS public.hr_certificate_requests_status_idx;
DROP INDEX IF EXISTS public.files_org_category_idx;
DROP INDEX IF EXISTS public.events_org_created_idx;
DROP INDEX IF EXISTS public.employee_categories_org_name_unique;
DROP INDEX IF EXISTS public.contract_templates_status_idx;
DROP INDEX IF EXISTS public.contract_templates_org_idx;
DROP INDEX IF EXISTS public.contract_submissions_org_number_unique;
DROP INDEX IF EXISTS public.contract_submissions_org_idx;
DROP INDEX IF EXISTS public.contract_invites_org_status_idx;
DROP INDEX IF EXISTS public.contract_invites_expiration_idx;
DROP INDEX IF EXISTS public.clients_org_person_search_idx;
DROP INDEX IF EXISTS public.clients_org_email_unique;
DROP INDEX IF EXISTS public.clients_org_cui_unique;
DROP INDEX IF EXISTS public.clients_org_company_search_idx;
DROP INDEX IF EXISTS public.clients_org_cnp_unique;
DROP INDEX IF EXISTS public.client_documents_client_idx;
DROP INDEX IF EXISTS public.chat_participants_user_idx;
DROP INDEX IF EXISTS public.chat_messages_org_idx;
DROP INDEX IF EXISTS public.chat_messages_conversation_idx;
DROP INDEX IF EXISTS public.chat_conversations_recent_idx;
DROP INDEX IF EXISTS public.chat_conversations_client_idx;
DROP INDEX IF EXISTS public.automation_rules_trigger_idx;
DROP INDEX IF EXISTS public.admins_email_unique;
DROP INDEX IF EXISTS public.accounts_status_idx;
DROP INDEX IF EXISTS public.accounts_email_unique;
DROP INDEX IF EXISTS public.access_token_logout_events_subject_idx;
ALTER TABLE IF EXISTS ONLY public.workspace_notes DROP CONSTRAINT IF EXISTS workspace_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.usage_counters DROP CONSTRAINT IF EXISTS usage_counters_pkey;
ALTER TABLE IF EXISTS ONLY public.ticketing_tasks DROP CONSTRAINT IF EXISTS ticketing_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;
ALTER TABLE IF EXISTS ONLY public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_stripe_price_id_key;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_slug_key;
ALTER TABLE IF EXISTS ONLY public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.stripe_events DROP CONSTRAINT IF EXISTS stripe_events_pkey;
ALTER TABLE IF EXISTS ONLY public.signatures DROP CONSTRAINT IF EXISTS signatures_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS refresh_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_sessions DROP CONSTRAINT IF EXISTS refresh_sessions_jti_key;
ALTER TABLE IF EXISTS ONLY public.planner_events DROP CONSTRAINT IF EXISTS planner_events_pkey;
ALTER TABLE IF EXISTS ONLY public.plan_features DROP CONSTRAINT IF EXISTS plan_features_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_slug_key;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.organisations DROP CONSTRAINT IF EXISTS organisations_pkey;
ALTER TABLE IF EXISTS ONLY public.organisation_settings DROP CONSTRAINT IF EXISTS organisation_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.organisation_memberships DROP CONSTRAINT IF EXISTS organisation_memberships_pkey;
ALTER TABLE IF EXISTS ONLY public.organisation_features DROP CONSTRAINT IF EXISTS organisation_features_pkey;
ALTER TABLE IF EXISTS ONLY public.organisation_feature_limits DROP CONSTRAINT IF EXISTS organisation_feature_limits_pkey;
ALTER TABLE IF EXISTS ONLY public.organisation_documents DROP CONSTRAINT IF EXISTS organisation_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notebook_documents DROP CONSTRAINT IF EXISTS notebook_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.message_templates DROP CONSTRAINT IF EXISTS message_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.membership_roles DROP CONSTRAINT IF EXISTS membership_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.job_runs DROP CONSTRAINT IF EXISTS job_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_reviews DROP CONSTRAINT IF EXISTS hr_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_leaves DROP CONSTRAINT IF EXISTS hr_leaves_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_hours DROP CONSTRAINT IF EXISTS hr_hours_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificate_requests DROP CONSTRAINT IF EXISTS hr_certificate_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.goose_db_version DROP CONSTRAINT IF EXISTS goose_db_version_pkey;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_storage_key_key;
ALTER TABLE IF EXISTS ONLY public.files DROP CONSTRAINT IF EXISTS files_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_definitions DROP CONSTRAINT IF EXISTS feature_definitions_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_definitions DROP CONSTRAINT IF EXISTS feature_definitions_feature_key_key;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_categories DROP CONSTRAINT IF EXISTS employee_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_templates DROP CONSTRAINT IF EXISTS contract_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_submissions DROP CONSTRAINT IF EXISTS contract_submissions_invite_id_key;
ALTER TABLE IF EXISTS ONLY public.contract_numbers DROP CONSTRAINT IF EXISTS contract_numbers_pkey;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_token_hash_key;
ALTER TABLE IF EXISTS ONLY public.contract_invites DROP CONSTRAINT IF EXISTS contract_invites_pkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY public.client_documents DROP CONSTRAINT IF EXISTS client_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_participants DROP CONSTRAINT IF EXISTS chat_participants_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_conversations DROP CONSTRAINT IF EXISTS chat_conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.automation_rules DROP CONSTRAINT IF EXISTS automation_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.access_token_logout_events DROP CONSTRAINT IF EXISTS access_token_logout_events_pkey;
ALTER TABLE IF EXISTS public.workspace_notes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ticketing_tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.subscription_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.signatures ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.planner_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.organisations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.organisation_memberships ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.organisation_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notebook_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.message_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hr_reviews ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hr_leaves ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hr_hours ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hr_certificate_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.files ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.feature_definitions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contract_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contract_submissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contract_invites ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clients ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.client_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_conversations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.automation_rules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admins ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.access_token_logout_events ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.workspace_notes_id_seq;
DROP TABLE IF EXISTS public.workspace_notes;
DROP TABLE IF EXISTS public.usage_counters;
DROP SEQUENCE IF EXISTS public.ticketing_tasks_id_seq;
DROP TABLE IF EXISTS public.ticketing_tasks;
DROP SEQUENCE IF EXISTS public.subscriptions_id_seq;
DROP TABLE IF EXISTS public.subscriptions;
DROP SEQUENCE IF EXISTS public.subscription_plans_id_seq;
DROP TABLE IF EXISTS public.subscription_plans;
DROP TABLE IF EXISTS public.stripe_events;
DROP SEQUENCE IF EXISTS public.signatures_id_seq;
DROP TABLE IF EXISTS public.signatures;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP SEQUENCE IF EXISTS public.refresh_sessions_id_seq;
DROP TABLE IF EXISTS public.refresh_sessions;
DROP SEQUENCE IF EXISTS public.planner_events_id_seq;
DROP TABLE IF EXISTS public.planner_events;
DROP TABLE IF EXISTS public.plan_features;
DROP SEQUENCE IF EXISTS public.permissions_id_seq;
DROP TABLE IF EXISTS public.permissions;
DROP SEQUENCE IF EXISTS public.organisations_id_seq;
DROP TABLE IF EXISTS public.organisations;
DROP TABLE IF EXISTS public.organisation_settings;
DROP SEQUENCE IF EXISTS public.organisation_memberships_id_seq;
DROP TABLE IF EXISTS public.organisation_memberships;
DROP TABLE IF EXISTS public.organisation_features;
DROP TABLE IF EXISTS public.organisation_feature_limits;
DROP SEQUENCE IF EXISTS public.organisation_documents_id_seq;
DROP TABLE IF EXISTS public.organisation_documents;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.notebook_documents_id_seq;
DROP TABLE IF EXISTS public.notebook_documents;
DROP SEQUENCE IF EXISTS public.message_templates_id_seq;
DROP TABLE IF EXISTS public.message_templates;
DROP TABLE IF EXISTS public.membership_roles;
DROP SEQUENCE IF EXISTS public.job_runs_id_seq;
DROP TABLE IF EXISTS public.job_runs;
DROP SEQUENCE IF EXISTS public.hr_reviews_id_seq;
DROP TABLE IF EXISTS public.hr_reviews;
DROP SEQUENCE IF EXISTS public.hr_leaves_id_seq;
DROP TABLE IF EXISTS public.hr_leaves;
DROP SEQUENCE IF EXISTS public.hr_hours_id_seq;
DROP TABLE IF EXISTS public.hr_hours;
DROP SEQUENCE IF EXISTS public.hr_certificate_requests_id_seq;
DROP TABLE IF EXISTS public.hr_certificate_requests;
DROP TABLE IF EXISTS public.goose_db_version;
DROP SEQUENCE IF EXISTS public.files_id_seq;
DROP TABLE IF EXISTS public.files;
DROP SEQUENCE IF EXISTS public.feature_definitions_id_seq;
DROP TABLE IF EXISTS public.feature_definitions;
DROP SEQUENCE IF EXISTS public.events_id_seq;
DROP TABLE IF EXISTS public.events;
DROP SEQUENCE IF EXISTS public.employee_categories_id_seq;
DROP TABLE IF EXISTS public.employee_categories;
DROP SEQUENCE IF EXISTS public.contract_templates_id_seq;
DROP TABLE IF EXISTS public.contract_templates;
DROP SEQUENCE IF EXISTS public.contract_submissions_id_seq;
DROP TABLE IF EXISTS public.contract_submissions;
DROP TABLE IF EXISTS public.contract_numbers;
DROP SEQUENCE IF EXISTS public.contract_invites_id_seq;
DROP TABLE IF EXISTS public.contract_invites;
DROP SEQUENCE IF EXISTS public.clients_id_seq;
DROP TABLE IF EXISTS public.clients;
DROP SEQUENCE IF EXISTS public.client_documents_id_seq;
DROP TABLE IF EXISTS public.client_documents;
DROP TABLE IF EXISTS public.chat_participants;
DROP SEQUENCE IF EXISTS public.chat_messages_id_seq;
DROP TABLE IF EXISTS public.chat_messages;
DROP SEQUENCE IF EXISTS public.chat_conversations_id_seq;
DROP TABLE IF EXISTS public.chat_conversations;
DROP SEQUENCE IF EXISTS public.automation_rules_id_seq;
DROP TABLE IF EXISTS public.automation_rules;
DROP SEQUENCE IF EXISTS public.admins_id_seq;
DROP TABLE IF EXISTS public.admins;
DROP SEQUENCE IF EXISTS public.accounts_id_seq;
DROP TABLE IF EXISTS public.accounts;
DROP SEQUENCE IF EXISTS public.access_token_logout_events_id_seq;
DROP TABLE IF EXISTS public.access_token_logout_events;
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_token_logout_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_token_logout_events (
    id bigint NOT NULL,
    actor_type text NOT NULL,
    subject_id bigint NOT NULL,
    organisation_id bigint,
    membership_id bigint,
    logged_out_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT access_token_logout_events_actor_type_check CHECK ((actor_type = ANY (ARRAY['admin'::text, 'account'::text])))
);


--
-- Name: access_token_logout_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_token_logout_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_token_logout_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_token_logout_events_id_seq OWNED BY public.access_token_logout_events.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id bigint NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    status text DEFAULT 'active'::text NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT accounts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'deleted'::text])))
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admins_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text])))
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rules (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    name text NOT NULL,
    trigger_type text NOT NULL,
    conditions_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    last_run_at timestamp with time zone,
    affected_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: automation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.automation_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: automation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.automation_rules_id_seq OWNED BY public.automation_rules.id;


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    type text DEFAULT 'group'::text NOT NULL,
    title text,
    client_id bigint,
    created_by_id bigint NOT NULL,
    last_message_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    archived_at timestamp with time zone,
    CONSTRAINT chat_conversations_type_check CHECK ((type = ANY (ARRAY['direct'::text, 'group'::text, 'client'::text])))
);


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_conversations_id_seq OWNED BY public.chat_conversations.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender_user_id bigint,
    kind text DEFAULT 'user'::text NOT NULL,
    body text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    derived_ticket_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone,
    CONSTRAINT chat_messages_kind_check CHECK ((kind = ANY (ARRAY['user'::text, 'system'::text, 'bot'::text])))
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_participants (
    conversation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    last_read_at timestamp with time zone,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone,
    CONSTRAINT chat_participants_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text])))
);


--
-- Name: client_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_documents (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    client_id bigint NOT NULL,
    file_id bigint NOT NULL,
    document_name text NOT NULL,
    file_type text,
    status text DEFAULT 'active'::text NOT NULL,
    expiration_date timestamp with time zone,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT client_documents_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


--
-- Name: client_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_documents_id_seq OWNED BY public.client_documents.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    owner_user_id bigint,
    client_type text DEFAULT 'person'::text NOT NULL,
    first_name text,
    last_name text,
    cnp text,
    company_name text,
    cui text,
    tva boolean DEFAULT false NOT NULL,
    responsible_name text,
    responsible_email text,
    email text,
    phone text,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT clients_client_type_check CHECK ((client_type = ANY (ARRAY['person'::text, 'company'::text]))),
    CONSTRAINT clients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text])))
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: contract_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_invites (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    template_id bigint NOT NULL,
    client_id bigint NOT NULL,
    created_by_id bigint NOT NULL,
    token_hash text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    remarks text,
    expiration_date timestamp with time zone,
    sent_at timestamp with time zone,
    viewed_at timestamp with time zone,
    revoked_at timestamp with time zone,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT contract_invites_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text, 'signed'::text, 'expired'::text, 'revoked'::text])))
);


--
-- Name: contract_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_invites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_invites_id_seq OWNED BY public.contract_invites.id;


--
-- Name: contract_numbers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_numbers (
    organisation_id bigint NOT NULL,
    year integer NOT NULL,
    last_number integer DEFAULT 0 NOT NULL,
    CONSTRAINT contract_numbers_last_number_check CHECK ((last_number >= 0)),
    CONSTRAINT contract_numbers_year_check CHECK ((year >= 2000))
);


--
-- Name: contract_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_submissions (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    invite_id bigint NOT NULL,
    template_id bigint NOT NULL,
    client_id bigint NOT NULL,
    filled_fields jsonb DEFAULT '{}'::jsonb NOT NULL,
    signature_image bytea,
    contract_number text,
    pdf_file_id bigint,
    status text DEFAULT 'signed'::text NOT NULL,
    signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT contract_submissions_status_check CHECK ((status = ANY (ARRAY['signed'::text, 'voided'::text])))
);


--
-- Name: contract_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_submissions_id_seq OWNED BY public.contract_submissions.id;


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_templates (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    created_by_id bigint NOT NULL,
    name text NOT NULL,
    contract_type text NOT NULL,
    content_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT contract_templates_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text])))
);


--
-- Name: contract_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_templates_id_seq OWNED BY public.contract_templates.id;


--
-- Name: employee_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_categories (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    name text NOT NULL,
    description text,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: employee_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_categories_id_seq OWNED BY public.employee_categories.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    organisation_id bigint,
    actor_type text,
    actor_id bigint,
    event_type text NOT NULL,
    entity_type text,
    entity_id bigint,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: feature_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_definitions (
    id bigint NOT NULL,
    feature_key text NOT NULL,
    name text NOT NULL,
    package_name text NOT NULL,
    category text DEFAULT 'extension'::text NOT NULL,
    description text,
    default_limits_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT feature_definitions_category_check CHECK ((category = ANY (ARRAY['base'::text, 'extension'::text, 'future'::text])))
);


--
-- Name: feature_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feature_definitions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feature_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feature_definitions_id_seq OWNED BY public.feature_definitions.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    uploaded_by_id bigint,
    storage_key text NOT NULL,
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    checksum_sha256 text,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT files_size_bytes_check CHECK ((size_bytes >= 0))
);


--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: goose_db_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goose_db_version (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: goose_db_version_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.goose_db_version ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.goose_db_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hr_certificate_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_certificate_requests (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    requested_by_id bigint NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    file_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT hr_certificate_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'generated'::text, 'rejected'::text]))),
    CONSTRAINT hr_certificate_requests_type_check CHECK ((type = ANY (ARRAY['employee_certificate'::text, 'income_certificate'::text])))
);


--
-- Name: hr_certificate_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_certificate_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_certificate_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_certificate_requests_id_seq OWNED BY public.hr_certificate_requests.id;


--
-- Name: hr_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_hours (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    work_date date NOT NULL,
    hours numeric NOT NULL,
    description text,
    status text DEFAULT 'submitted'::text NOT NULL,
    approved_by_id bigint,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT hr_hours_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: hr_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_hours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_hours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_hours_id_seq OWNED BY public.hr_hours.id;


--
-- Name: hr_leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_leaves (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    starts_on date NOT NULL,
    ends_on date NOT NULL,
    reason text,
    reviewed_by_id bigint,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT hr_leaves_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT hr_leaves_type_check CHECK ((type = ANY (ARRAY['odihna'::text, 'medical'::text, 'sabatic'::text, 'maternal'::text])))
);


--
-- Name: hr_leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_leaves_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_leaves_id_seq OWNED BY public.hr_leaves.id;


--
-- Name: hr_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_reviews (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    reviewer_user_id bigint NOT NULL,
    period_start date,
    period_end date,
    rating integer,
    notes text,
    review_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_reviews_id_seq OWNED BY public.hr_reviews.id;


--
-- Name: job_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_runs (
    id bigint NOT NULL,
    job_name text NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    error text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT job_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'failed'::text])))
);


--
-- Name: job_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_runs_id_seq OWNED BY public.job_runs.id;


--
-- Name: membership_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_roles (
    membership_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: message_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_templates (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    created_by_id bigint,
    title text NOT NULL,
    content text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: message_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_templates_id_seq OWNED BY public.message_templates.id;


--
-- Name: notebook_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notebook_documents (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    title text NOT NULL,
    content_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    folder text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: notebook_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notebook_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notebook_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notebook_documents_id_seq OWNED BY public.notebook_documents.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    organisation_id bigint,
    user_id bigint NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    type text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    read_at timestamp with time zone,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: organisation_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation_documents (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    file_id bigint NOT NULL,
    uploaded_by_id bigint,
    document_name text NOT NULL,
    document_type text,
    visibility text DEFAULT 'organisation'::text NOT NULL,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT organisation_documents_visibility_check CHECK ((visibility = ANY (ARRAY['organisation'::text, 'restricted'::text])))
);


--
-- Name: organisation_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organisation_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organisation_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organisation_documents_id_seq OWNED BY public.organisation_documents.id;


--
-- Name: organisation_feature_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation_feature_limits (
    organisation_id bigint NOT NULL,
    feature_definition_id bigint NOT NULL,
    limit_key text NOT NULL,
    limit_value bigint NOT NULL,
    period text DEFAULT 'none'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT organisation_feature_limits_limit_value_check CHECK ((limit_value >= 0)),
    CONSTRAINT organisation_feature_limits_period_check CHECK ((period = ANY (ARRAY['none'::text, 'monthly'::text, 'yearly'::text])))
);


--
-- Name: organisation_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation_features (
    organisation_id bigint NOT NULL,
    feature_definition_id bigint NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    source text DEFAULT 'subscription'::text NOT NULL,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT organisation_features_source_check CHECK ((source = ANY (ARRAY['subscription'::text, 'manual'::text, 'trial'::text, 'custom'::text])))
);


--
-- Name: organisation_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation_memberships (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    account_id bigint NOT NULL,
    employee_category_id bigint,
    display_name text,
    job_title text,
    status text DEFAULT 'active'::text NOT NULL,
    invited_by_membership_id bigint,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT organisation_memberships_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'active'::text, 'suspended'::text, 'removed'::text])))
);


--
-- Name: organisation_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organisation_memberships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organisation_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organisation_memberships_id_seq OWNED BY public.organisation_memberships.id;


--
-- Name: organisation_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisation_settings (
    organisation_id bigint NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisations (
    id bigint NOT NULL,
    name text NOT NULL,
    cui text,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT organisations_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'deleted'::text])))
);


--
-- Name: organisations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organisations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organisations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organisations_id_seq OWNED BY public.organisations.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    slug text NOT NULL,
    description text
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_features (
    subscription_plan_id bigint NOT NULL,
    feature_definition_id bigint NOT NULL,
    limits_json jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: planner_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_events (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    client_id bigint,
    title text NOT NULL,
    description text,
    category text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    all_day boolean DEFAULT false NOT NULL,
    source_type text,
    source_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT planner_events_category_check CHECK ((category = ANY (ARRAY['contract'::text, 'ticket'::text, 'meeting'::text, 'reminder'::text, 'hr'::text, 'custom'::text])))
);


--
-- Name: planner_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.planner_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: planner_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.planner_events_id_seq OWNED BY public.planner_events.id;


--
-- Name: refresh_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_sessions (
    id bigint NOT NULL,
    jti text NOT NULL,
    actor_type text NOT NULL,
    subject_id bigint NOT NULL,
    active_organisation_id bigint,
    active_membership_id bigint,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT refresh_sessions_actor_type_check CHECK ((actor_type = ANY (ARRAY['admin'::text, 'account'::text])))
);


--
-- Name: refresh_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_sessions_id_seq OWNED BY public.refresh_sessions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id bigint NOT NULL,
    permission_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    system_role boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signatures (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    owner_user_id bigint,
    name text NOT NULL,
    file_id bigint,
    signature_png bytea,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signatures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signatures_id_seq OWNED BY public.signatures.id;


--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_events (
    id text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id bigint NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    plan_kind text DEFAULT 'base'::text NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    stripe_price_id text,
    limits_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    features_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscription_plans_plan_kind_check CHECK ((plan_kind = ANY (ARRAY['base'::text, 'extension'::text, 'bundle'::text, 'custom'::text]))),
    CONSTRAINT subscription_plans_price_cents_check CHECK ((price_cents >= 0))
);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscription_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscription_plans_id_seq OWNED BY public.subscription_plans.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    subscription_plan_id bigint NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'expired'::text])))
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: ticketing_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticketing_tasks (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    created_by_id bigint NOT NULL,
    assignee_user_id bigint,
    client_id bigint,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    source_type text,
    source_id bigint,
    due_at timestamp with time zone,
    claimed_at timestamp with time zone,
    completed_at timestamp with time zone,
    refused_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT ticketing_tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT ticketing_tasks_source_type_check CHECK (((source_type IS NULL) OR (source_type = ANY (ARRAY['manual'::text, 'chat'::text, 'ai'::text, 'client'::text, 'contract'::text])))),
    CONSTRAINT ticketing_tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'blocked'::text, 'done'::text, 'archived'::text])))
);


--
-- Name: ticketing_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticketing_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticketing_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticketing_tasks_id_seq OWNED BY public.ticketing_tasks.id;


--
-- Name: usage_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_counters (
    organisation_id bigint NOT NULL,
    period_start date NOT NULL,
    metric text NOT NULL,
    value bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usage_counters_value_check CHECK ((value >= 0))
);


--
-- Name: workspace_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_notes (
    id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    client_id bigint,
    visibility text DEFAULT 'personal'::text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT workspace_notes_visibility_check CHECK ((visibility = ANY (ARRAY['personal'::text, 'shared'::text])))
);


--
-- Name: workspace_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workspace_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workspace_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workspace_notes_id_seq OWNED BY public.workspace_notes.id;


--
-- Name: access_token_logout_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_token_logout_events ALTER COLUMN id SET DEFAULT nextval('public.access_token_logout_events_id_seq'::regclass);


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: automation_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules ALTER COLUMN id SET DEFAULT nextval('public.automation_rules_id_seq'::regclass);


--
-- Name: chat_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations ALTER COLUMN id SET DEFAULT nextval('public.chat_conversations_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: client_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents ALTER COLUMN id SET DEFAULT nextval('public.client_documents_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: contract_invites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites ALTER COLUMN id SET DEFAULT nextval('public.contract_invites_id_seq'::regclass);


--
-- Name: contract_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions ALTER COLUMN id SET DEFAULT nextval('public.contract_submissions_id_seq'::regclass);


--
-- Name: contract_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates ALTER COLUMN id SET DEFAULT nextval('public.contract_templates_id_seq'::regclass);


--
-- Name: employee_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_categories ALTER COLUMN id SET DEFAULT nextval('public.employee_categories_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: feature_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_definitions ALTER COLUMN id SET DEFAULT nextval('public.feature_definitions_id_seq'::regclass);


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: hr_certificate_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests ALTER COLUMN id SET DEFAULT nextval('public.hr_certificate_requests_id_seq'::regclass);


--
-- Name: hr_hours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_hours ALTER COLUMN id SET DEFAULT nextval('public.hr_hours_id_seq'::regclass);


--
-- Name: hr_leaves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leaves ALTER COLUMN id SET DEFAULT nextval('public.hr_leaves_id_seq'::regclass);


--
-- Name: hr_reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_reviews ALTER COLUMN id SET DEFAULT nextval('public.hr_reviews_id_seq'::regclass);


--
-- Name: job_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_runs ALTER COLUMN id SET DEFAULT nextval('public.job_runs_id_seq'::regclass);


--
-- Name: message_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates ALTER COLUMN id SET DEFAULT nextval('public.message_templates_id_seq'::regclass);


--
-- Name: notebook_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_documents ALTER COLUMN id SET DEFAULT nextval('public.notebook_documents_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: organisation_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_documents ALTER COLUMN id SET DEFAULT nextval('public.organisation_documents_id_seq'::regclass);


--
-- Name: organisation_memberships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships ALTER COLUMN id SET DEFAULT nextval('public.organisation_memberships_id_seq'::regclass);


--
-- Name: organisations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations ALTER COLUMN id SET DEFAULT nextval('public.organisations_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: planner_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_events ALTER COLUMN id SET DEFAULT nextval('public.planner_events_id_seq'::regclass);


--
-- Name: refresh_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions ALTER COLUMN id SET DEFAULT nextval('public.refresh_sessions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: signatures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures ALTER COLUMN id SET DEFAULT nextval('public.signatures_id_seq'::regclass);


--
-- Name: subscription_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans ALTER COLUMN id SET DEFAULT nextval('public.subscription_plans_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: ticketing_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks ALTER COLUMN id SET DEFAULT nextval('public.ticketing_tasks_id_seq'::regclass);


--
-- Name: workspace_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_notes ALTER COLUMN id SET DEFAULT nextval('public.workspace_notes_id_seq'::regclass);


--
-- Name: access_token_logout_events access_token_logout_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_token_logout_events
    ADD CONSTRAINT access_token_logout_events_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: client_documents client_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contract_invites contract_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_pkey PRIMARY KEY (id);


--
-- Name: contract_invites contract_invites_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_token_hash_key UNIQUE (token_hash);


--
-- Name: contract_numbers contract_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_numbers
    ADD CONSTRAINT contract_numbers_pkey PRIMARY KEY (organisation_id, year);


--
-- Name: contract_submissions contract_submissions_invite_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_invite_id_key UNIQUE (invite_id);


--
-- Name: contract_submissions contract_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_pkey PRIMARY KEY (id);


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_pkey PRIMARY KEY (id);


--
-- Name: employee_categories employee_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_categories
    ADD CONSTRAINT employee_categories_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: feature_definitions feature_definitions_feature_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_definitions
    ADD CONSTRAINT feature_definitions_feature_key_key UNIQUE (feature_key);


--
-- Name: feature_definitions feature_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_definitions
    ADD CONSTRAINT feature_definitions_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: files files_storage_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_storage_key_key UNIQUE (storage_key);


--
-- Name: goose_db_version goose_db_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goose_db_version
    ADD CONSTRAINT goose_db_version_pkey PRIMARY KEY (id);


--
-- Name: hr_certificate_requests hr_certificate_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests
    ADD CONSTRAINT hr_certificate_requests_pkey PRIMARY KEY (id);


--
-- Name: hr_hours hr_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_hours
    ADD CONSTRAINT hr_hours_pkey PRIMARY KEY (id);


--
-- Name: hr_leaves hr_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leaves
    ADD CONSTRAINT hr_leaves_pkey PRIMARY KEY (id);


--
-- Name: hr_reviews hr_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_reviews
    ADD CONSTRAINT hr_reviews_pkey PRIMARY KEY (id);


--
-- Name: job_runs job_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_runs
    ADD CONSTRAINT job_runs_pkey PRIMARY KEY (id);


--
-- Name: membership_roles membership_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_roles
    ADD CONSTRAINT membership_roles_pkey PRIMARY KEY (membership_id, role_id);


--
-- Name: message_templates message_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_pkey PRIMARY KEY (id);


--
-- Name: notebook_documents notebook_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_documents
    ADD CONSTRAINT notebook_documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organisation_documents organisation_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_documents
    ADD CONSTRAINT organisation_documents_pkey PRIMARY KEY (id);


--
-- Name: organisation_feature_limits organisation_feature_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_feature_limits
    ADD CONSTRAINT organisation_feature_limits_pkey PRIMARY KEY (organisation_id, feature_definition_id, limit_key);


--
-- Name: organisation_features organisation_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_features
    ADD CONSTRAINT organisation_features_pkey PRIMARY KEY (organisation_id, feature_definition_id);


--
-- Name: organisation_memberships organisation_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships
    ADD CONSTRAINT organisation_memberships_pkey PRIMARY KEY (id);


--
-- Name: organisation_settings organisation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_settings
    ADD CONSTRAINT organisation_settings_pkey PRIMARY KEY (organisation_id);


--
-- Name: organisations organisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT organisations_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_slug_key UNIQUE (slug);


--
-- Name: plan_features plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_pkey PRIMARY KEY (subscription_plan_id, feature_definition_id);


--
-- Name: planner_events planner_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_events
    ADD CONSTRAINT planner_events_pkey PRIMARY KEY (id);


--
-- Name: refresh_sessions refresh_sessions_jti_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_jti_key UNIQUE (jti);


--
-- Name: refresh_sessions refresh_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: signatures signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: subscription_plans subscription_plans_stripe_price_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_stripe_price_id_key UNIQUE (stripe_price_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: ticketing_tasks ticketing_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks
    ADD CONSTRAINT ticketing_tasks_pkey PRIMARY KEY (id);


--
-- Name: usage_counters usage_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_counters
    ADD CONSTRAINT usage_counters_pkey PRIMARY KEY (organisation_id, period_start, metric);


--
-- Name: workspace_notes workspace_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_pkey PRIMARY KEY (id);


--
-- Name: access_token_logout_events_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX access_token_logout_events_subject_idx ON public.access_token_logout_events USING btree (actor_type, subject_id, logged_out_at DESC);


--
-- Name: accounts_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX accounts_email_unique ON public.accounts USING btree (lower(email)) WHERE (deleted_at IS NULL);


--
-- Name: accounts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX accounts_status_idx ON public.accounts USING btree (status);


--
-- Name: admins_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admins_email_unique ON public.admins USING btree (lower(email));


--
-- Name: automation_rules_trigger_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX automation_rules_trigger_idx ON public.automation_rules USING btree (organisation_id, active, trigger_type) WHERE (deleted_at IS NULL);


--
-- Name: chat_conversations_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_conversations_client_idx ON public.chat_conversations USING btree (organisation_id, client_id);


--
-- Name: chat_conversations_recent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_conversations_recent_idx ON public.chat_conversations USING btree (organisation_id, last_message_at);


--
-- Name: chat_messages_conversation_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_conversation_idx ON public.chat_messages USING btree (conversation_id, created_at);


--
-- Name: chat_messages_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_messages_org_idx ON public.chat_messages USING btree (organisation_id, created_at);


--
-- Name: chat_participants_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_participants_user_idx ON public.chat_participants USING btree (user_id, last_read_at);


--
-- Name: client_documents_client_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX client_documents_client_idx ON public.client_documents USING btree (organisation_id, client_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: clients_org_cnp_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_org_cnp_unique ON public.clients USING btree (organisation_id, cnp) WHERE ((cnp IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: clients_org_company_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_org_company_search_idx ON public.clients USING btree (organisation_id, company_name) WHERE (deleted_at IS NULL);


--
-- Name: clients_org_cui_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_org_cui_unique ON public.clients USING btree (organisation_id, cui) WHERE ((cui IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: clients_org_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_org_email_unique ON public.clients USING btree (organisation_id, lower(email)) WHERE ((email IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: clients_org_person_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_org_person_search_idx ON public.clients USING btree (organisation_id, last_name, first_name) WHERE (deleted_at IS NULL);


--
-- Name: contract_invites_expiration_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_invites_expiration_idx ON public.contract_invites USING btree (expiration_date) WHERE ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'viewed'::text])) AND (deleted_at IS NULL));


--
-- Name: contract_invites_org_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_invites_org_status_idx ON public.contract_invites USING btree (organisation_id, status, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: contract_submissions_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_submissions_org_idx ON public.contract_submissions USING btree (organisation_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: contract_submissions_org_number_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contract_submissions_org_number_unique ON public.contract_submissions USING btree (organisation_id, contract_number) WHERE ((contract_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: contract_templates_org_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_templates_org_idx ON public.contract_templates USING btree (organisation_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: contract_templates_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_templates_status_idx ON public.contract_templates USING btree (organisation_id, status) WHERE (deleted_at IS NULL);


--
-- Name: employee_categories_org_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_categories_org_name_unique ON public.employee_categories USING btree (organisation_id, lower(name)) WHERE (deleted_at IS NULL);


--
-- Name: events_org_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX events_org_created_idx ON public.events USING btree (organisation_id, created_at DESC);


--
-- Name: files_org_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_org_category_idx ON public.files USING btree (organisation_id, category, created_at DESC);


--
-- Name: hr_certificate_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_certificate_requests_status_idx ON public.hr_certificate_requests USING btree (organisation_id, status, created_at);


--
-- Name: hr_certificate_requests_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_certificate_requests_user_idx ON public.hr_certificate_requests USING btree (organisation_id, user_id, created_at);


--
-- Name: hr_hours_user_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_hours_user_date_idx ON public.hr_hours USING btree (organisation_id, user_id, work_date);


--
-- Name: hr_leaves_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_leaves_status_idx ON public.hr_leaves USING btree (organisation_id, status, starts_on);


--
-- Name: hr_leaves_user_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_leaves_user_period_idx ON public.hr_leaves USING btree (organisation_id, user_id, starts_on);


--
-- Name: hr_reviews_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hr_reviews_user_idx ON public.hr_reviews USING btree (organisation_id, user_id, created_at);


--
-- Name: job_runs_name_started_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX job_runs_name_started_idx ON public.job_runs USING btree (job_name, started_at DESC);


--
-- Name: message_templates_org_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX message_templates_org_category_idx ON public.message_templates USING btree (organisation_id, category, created_at) WHERE (deleted_at IS NULL);


--
-- Name: notebook_documents_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notebook_documents_owner_idx ON public.notebook_documents USING btree (organisation_id, owner_user_id, updated_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: notifications_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread_idx ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: notifications_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: organisation_documents_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organisation_documents_type_idx ON public.organisation_documents USING btree (organisation_id, document_type, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: organisation_features_feature_enabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organisation_features_feature_enabled_idx ON public.organisation_features USING btree (feature_definition_id, enabled);


--
-- Name: organisation_memberships_account_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organisation_memberships_account_status_idx ON public.organisation_memberships USING btree (account_id, status);


--
-- Name: organisation_memberships_account_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organisation_memberships_account_unique ON public.organisation_memberships USING btree (organisation_id, account_id) WHERE (deleted_at IS NULL);


--
-- Name: organisation_memberships_org_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organisation_memberships_org_status_idx ON public.organisation_memberships USING btree (organisation_id, status);


--
-- Name: organisations_cui_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organisations_cui_unique ON public.organisations USING btree (cui) WHERE ((cui IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: planner_events_org_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_events_org_time_idx ON public.planner_events USING btree (organisation_id, starts_at) WHERE (deleted_at IS NULL);


--
-- Name: planner_events_owner_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_events_owner_time_idx ON public.planner_events USING btree (organisation_id, owner_user_id, starts_at) WHERE (deleted_at IS NULL);


--
-- Name: refresh_sessions_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_sessions_subject_idx ON public.refresh_sessions USING btree (actor_type, subject_id);


--
-- Name: roles_org_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_org_slug_unique ON public.roles USING btree (organisation_id, slug);


--
-- Name: signatures_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signatures_owner_idx ON public.signatures USING btree (organisation_id, owner_user_id) WHERE (deleted_at IS NULL);


--
-- Name: subscriptions_org_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_org_status_idx ON public.subscriptions USING btree (organisation_id, status);


--
-- Name: ticketing_tasks_assignee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticketing_tasks_assignee_idx ON public.ticketing_tasks USING btree (organisation_id, assignee_user_id, status) WHERE (deleted_at IS NULL);


--
-- Name: ticketing_tasks_pipeline_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticketing_tasks_pipeline_idx ON public.ticketing_tasks USING btree (organisation_id, status, priority, due_at) WHERE (deleted_at IS NULL);


--
-- Name: workspace_notes_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workspace_notes_owner_idx ON public.workspace_notes USING btree (organisation_id, owner_user_id, updated_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: workspace_notes_visibility_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workspace_notes_visibility_idx ON public.workspace_notes USING btree (organisation_id, visibility, updated_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: access_token_logout_events access_token_logout_events_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_token_logout_events
    ADD CONSTRAINT access_token_logout_events_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: access_token_logout_events access_token_logout_events_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_token_logout_events
    ADD CONSTRAINT access_token_logout_events_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;


--
-- Name: automation_rules automation_rules_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: chat_conversations chat_conversations_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: chat_conversations chat_conversations_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_derived_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_derived_ticket_id_fkey FOREIGN KEY (derived_ticket_id) REFERENCES public.ticketing_tasks(id) ON DELETE SET NULL;


--
-- Name: chat_messages chat_messages_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: chat_participants chat_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: client_documents client_documents_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_documents client_documents_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE RESTRICT;


--
-- Name: client_documents client_documents_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_documents
    ADD CONSTRAINT client_documents_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: clients clients_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: clients clients_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: contract_invites contract_invites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: contract_invites contract_invites_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: contract_invites contract_invites_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: contract_invites contract_invites_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_invites
    ADD CONSTRAINT contract_invites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE RESTRICT;


--
-- Name: contract_numbers contract_numbers_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_numbers
    ADD CONSTRAINT contract_numbers_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: contract_submissions contract_submissions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: contract_submissions contract_submissions_invite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_invite_id_fkey FOREIGN KEY (invite_id) REFERENCES public.contract_invites(id) ON DELETE RESTRICT;


--
-- Name: contract_submissions contract_submissions_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: contract_submissions contract_submissions_pdf_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_pdf_file_id_fkey FOREIGN KEY (pdf_file_id) REFERENCES public.files(id) ON DELETE SET NULL;


--
-- Name: contract_submissions contract_submissions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_submissions
    ADD CONSTRAINT contract_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.contract_templates(id) ON DELETE RESTRICT;


--
-- Name: contract_templates contract_templates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: contract_templates contract_templates_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_templates
    ADD CONSTRAINT contract_templates_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: employee_categories employee_categories_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_categories
    ADD CONSTRAINT employee_categories_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: events events_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;


--
-- Name: files files_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: files files_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: hr_certificate_requests hr_certificate_requests_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests
    ADD CONSTRAINT hr_certificate_requests_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE SET NULL;


--
-- Name: hr_certificate_requests hr_certificate_requests_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests
    ADD CONSTRAINT hr_certificate_requests_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: hr_certificate_requests hr_certificate_requests_requested_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests
    ADD CONSTRAINT hr_certificate_requests_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: hr_certificate_requests hr_certificate_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificate_requests
    ADD CONSTRAINT hr_certificate_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: hr_hours hr_hours_approved_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_hours
    ADD CONSTRAINT hr_hours_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: hr_hours hr_hours_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_hours
    ADD CONSTRAINT hr_hours_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: hr_hours hr_hours_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_hours
    ADD CONSTRAINT hr_hours_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: hr_leaves hr_leaves_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leaves
    ADD CONSTRAINT hr_leaves_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: hr_leaves hr_leaves_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leaves
    ADD CONSTRAINT hr_leaves_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: hr_leaves hr_leaves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leaves
    ADD CONSTRAINT hr_leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: hr_reviews hr_reviews_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_reviews
    ADD CONSTRAINT hr_reviews_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: hr_reviews hr_reviews_reviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_reviews
    ADD CONSTRAINT hr_reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: hr_reviews hr_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_reviews
    ADD CONSTRAINT hr_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: membership_roles membership_roles_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_roles
    ADD CONSTRAINT membership_roles_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: membership_roles membership_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_roles
    ADD CONSTRAINT membership_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: message_templates message_templates_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: message_templates message_templates_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_templates
    ADD CONSTRAINT message_templates_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: notebook_documents notebook_documents_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_documents
    ADD CONSTRAINT notebook_documents_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: notebook_documents notebook_documents_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notebook_documents
    ADD CONSTRAINT notebook_documents_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: organisation_documents organisation_documents_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_documents
    ADD CONSTRAINT organisation_documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE RESTRICT;


--
-- Name: organisation_documents organisation_documents_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_documents
    ADD CONSTRAINT organisation_documents_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: organisation_documents organisation_documents_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_documents
    ADD CONSTRAINT organisation_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: organisation_feature_limits organisation_feature_limits_feature_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_feature_limits
    ADD CONSTRAINT organisation_feature_limits_feature_definition_id_fkey FOREIGN KEY (feature_definition_id) REFERENCES public.feature_definitions(id) ON DELETE CASCADE;


--
-- Name: organisation_feature_limits organisation_feature_limits_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_feature_limits
    ADD CONSTRAINT organisation_feature_limits_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: organisation_features organisation_features_feature_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_features
    ADD CONSTRAINT organisation_features_feature_definition_id_fkey FOREIGN KEY (feature_definition_id) REFERENCES public.feature_definitions(id) ON DELETE CASCADE;


--
-- Name: organisation_features organisation_features_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_features
    ADD CONSTRAINT organisation_features_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: organisation_memberships organisation_memberships_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships
    ADD CONSTRAINT organisation_memberships_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: organisation_memberships organisation_memberships_employee_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships
    ADD CONSTRAINT organisation_memberships_employee_category_id_fkey FOREIGN KEY (employee_category_id) REFERENCES public.employee_categories(id) ON DELETE SET NULL;


--
-- Name: organisation_memberships organisation_memberships_invited_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships
    ADD CONSTRAINT organisation_memberships_invited_by_fk FOREIGN KEY (invited_by_membership_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: organisation_memberships organisation_memberships_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_memberships
    ADD CONSTRAINT organisation_memberships_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: organisation_settings organisation_settings_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisation_settings
    ADD CONSTRAINT organisation_settings_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: plan_features plan_features_feature_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_feature_definition_id_fkey FOREIGN KEY (feature_definition_id) REFERENCES public.feature_definitions(id) ON DELETE CASCADE;


--
-- Name: plan_features plan_features_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_features
    ADD CONSTRAINT plan_features_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;


--
-- Name: planner_events planner_events_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_events
    ADD CONSTRAINT planner_events_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: planner_events planner_events_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_events
    ADD CONSTRAINT planner_events_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: planner_events planner_events_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_events
    ADD CONSTRAINT planner_events_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: refresh_sessions refresh_sessions_active_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_active_membership_id_fkey FOREIGN KEY (active_membership_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: refresh_sessions refresh_sessions_active_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_sessions
    ADD CONSTRAINT refresh_sessions_active_organisation_id_fkey FOREIGN KEY (active_organisation_id) REFERENCES public.organisations(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: signatures signatures_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id) ON DELETE SET NULL;


--
-- Name: signatures signatures_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: signatures signatures_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signatures
    ADD CONSTRAINT signatures_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: ticketing_tasks ticketing_tasks_assignee_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks
    ADD CONSTRAINT ticketing_tasks_assignee_user_id_fkey FOREIGN KEY (assignee_user_id) REFERENCES public.organisation_memberships(id) ON DELETE SET NULL;


--
-- Name: ticketing_tasks ticketing_tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks
    ADD CONSTRAINT ticketing_tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: ticketing_tasks ticketing_tasks_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks
    ADD CONSTRAINT ticketing_tasks_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.organisation_memberships(id) ON DELETE RESTRICT;


--
-- Name: ticketing_tasks ticketing_tasks_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticketing_tasks
    ADD CONSTRAINT ticketing_tasks_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: usage_counters usage_counters_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_counters
    ADD CONSTRAINT usage_counters_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: workspace_notes workspace_notes_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: workspace_notes workspace_notes_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: workspace_notes workspace_notes_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_notes
    ADD CONSTRAINT workspace_notes_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.organisation_memberships(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict JjllxlrQrYhAkOVBttz3pvKw4gwqa1OUPtMpZzpGzGreobFfM73NurvJjh17HKo

--
-- PostgreSQL database dump
--

\restrict nEW6PMvLTW4Wd2ANU3ZUfjEZujx8OEhrfyJyToXzRIJ8yeB0yTuPWeMUx7YdBWu

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: goose_db_version; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goose_db_version (id, version_id, is_applied, tstamp) FROM stdin;
1	0	t	2026-05-02 21:34:41.469646
2	1	t	2026-05-02 21:34:41.512295
3	2	t	2026-05-02 21:34:41.687113
4	3	t	2026-05-02 21:34:41.695592
5	4	t	2026-05-02 21:34:41.7115
6	5	t	2026-05-02 21:34:41.71778
7	6	t	2026-05-02 21:34:41.736557
8	7	t	2026-05-02 21:34:41.767904
9	8	t	2026-05-02 21:34:41.775903
10	9	t	2026-05-03 21:34:22.730216
\.


--
-- Name: goose_db_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goose_db_version_id_seq', 10, true);


--
-- PostgreSQL database dump complete
--

\unrestrict nEW6PMvLTW4Wd2ANU3ZUfjEZujx8OEhrfyJyToXzRIJ8yeB0yTuPWeMUx7YdBWu
