-- +goose Up
CREATE TABLE IF NOT EXISTS chat_conversations (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'group' CHECK (type IN ('direct', 'group', 'client')),
  title text,
  client_id bigint REFERENCES clients(id) ON DELETE SET NULL,
  created_by_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE RESTRICT,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS chat_conversations_recent_idx
  ON chat_conversations (organisation_id, last_message_at);

CREATE INDEX IF NOT EXISTS chat_conversations_client_idx
  ON chat_conversations (organisation_id, client_id);

CREATE TABLE IF NOT EXISTS chat_participants (
  conversation_id bigint NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES organisation_memberships(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_participants_user_idx
  ON chat_participants (user_id, last_read_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id bigserial PRIMARY KEY,
  organisation_id bigint NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  conversation_id bigint NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_user_id bigint REFERENCES organisation_memberships(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'user' CHECK (kind IN ('user', 'system', 'bot')),
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  derived_ticket_id bigint REFERENCES ticketing_tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx
  ON chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS chat_messages_org_idx
  ON chat_messages (organisation_id, created_at);

INSERT INTO feature_definitions (
  feature_key,
  name,
  package_name,
  category,
  description,
  default_limits_json
)
VALUES (
  'internal_chat',
  'Internal Chat',
  'Internal Chat Package',
  'extension',
  'Internal workspace conversations and messages.',
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
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_participants;
DROP TABLE IF EXISTS chat_conversations;
