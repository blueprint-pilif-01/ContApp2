-- ContApp2 local development seed data.
--
-- Run after migrations:
--   make seed-db
--
-- Demo credentials:
--   admin: admin@contapp.local / password
--   user:  owner@demo.contapp.local / password

DO $$
DECLARE
  v_admin_id bigint;
  v_org_id bigint;
  v_account_id bigint;
  v_category_id bigint;
  v_membership_id bigint;
  v_role_id bigint;
  v_base_plan_id bigint;
  v_contracts_plan_id bigint;
  v_ticketing_plan_id bigint;
  v_documents_feature_id bigint;
  v_workspace_notes_feature_id bigint;
  v_contracts_feature_id bigint;
  v_ticketing_feature_id bigint;
  v_internal_chat_feature_id bigint;
  v_hr_feature_id bigint;
  v_client_person_id bigint;
  v_client_company_id bigint;
  v_file_id bigint;
  v_org_document_id bigint;
  v_client_document_id bigint;
  v_template_id bigint;
  v_invite_id bigint;
BEGIN
  INSERT INTO admins (email, password_hash, first_name, last_name, status)
  VALUES (
    'admin@contapp.local',
    '$2a$10$r7YcsOG83mlBP6qH/RNiAu99Q8t5LguvzlgB8Vkj8eGTKgZglUXYS',
    'Platform',
    'Admin',
    'active'
  )
  ON CONFLICT (lower(email)) DO UPDATE
  SET
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO v_admin_id;

  SELECT id INTO v_org_id
  FROM organisations
  WHERE cui = 'RO-DEMO-001'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organisations (name, cui, address, status)
    VALUES ('Demo Workspace SRL', 'RO-DEMO-001', 'Bucharest, Romania', 'active')
    RETURNING id INTO v_org_id;
  ELSE
    UPDATE organisations
    SET
      name = 'Demo Workspace SRL',
      address = 'Bucharest, Romania',
      status = 'active',
      updated_at = now()
    WHERE id = v_org_id
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO organisation_settings (organisation_id, settings)
  VALUES (
    v_org_id,
    '{"locale":"ro-RO","timezone":"Europe/Bucharest","currency":"EUR"}'::jsonb
  )
  ON CONFLICT (organisation_id) DO UPDATE
  SET settings = EXCLUDED.settings, updated_at = now();

  SELECT id INTO v_category_id
  FROM employee_categories
  WHERE organisation_id = v_org_id
    AND lower(name) = lower('Management')
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO employee_categories (organisation_id, name, description, color)
    VALUES (v_org_id, 'Management', 'Business owner and management users', '#2563eb')
    RETURNING id INTO v_category_id;
  ELSE
    UPDATE employee_categories
    SET
      description = 'Business owner and management users',
      color = '#2563eb',
      updated_at = now()
    WHERE id = v_category_id
    RETURNING id INTO v_category_id;
  END IF;

  SELECT id INTO v_account_id
  FROM accounts
  WHERE lower(email) = lower('owner@demo.contapp.local')
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_account_id IS NULL THEN
    INSERT INTO accounts (email, password_hash, first_name, last_name, phone, status)
    VALUES (
      'owner@demo.contapp.local',
      '$2a$10$r7YcsOG83mlBP6qH/RNiAu99Q8t5LguvzlgB8Vkj8eGTKgZglUXYS',
      'Demo',
      'Owner',
      '+40700000000',
      'active'
    )
    RETURNING id INTO v_account_id;
  ELSE
    UPDATE accounts
    SET
      password_hash = '$2a$10$r7YcsOG83mlBP6qH/RNiAu99Q8t5LguvzlgB8Vkj8eGTKgZglUXYS',
      first_name = 'Demo',
      last_name = 'Owner',
      phone = '+40700000000',
      status = 'active',
      updated_at = now()
    WHERE id = v_account_id
    RETURNING id INTO v_account_id;
  END IF;

  SELECT id INTO v_membership_id
  FROM organisation_memberships
  WHERE organisation_id = v_org_id
    AND account_id = v_account_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_membership_id IS NULL THEN
    INSERT INTO organisation_memberships (
      organisation_id,
      account_id,
      employee_category_id,
      display_name,
      job_title,
      status,
      joined_at
    )
    VALUES (
      v_org_id,
      v_account_id,
      v_category_id,
      'Demo Owner',
      'Owner',
      'active',
      now()
    )
    RETURNING id INTO v_membership_id;
  ELSE
    UPDATE organisation_memberships
    SET
      employee_category_id = v_category_id,
      display_name = 'Demo Owner',
      job_title = 'Owner',
      status = 'active',
      updated_at = now()
    WHERE id = v_membership_id
    RETURNING id INTO v_membership_id;
  END IF;

  INSERT INTO roles (organisation_id, slug, name, system_role)
  VALUES (v_org_id, 'owner', 'Owner', true)
  ON CONFLICT (organisation_id, slug) DO UPDATE
  SET name = EXCLUDED.name, system_role = EXCLUDED.system_role
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_role_id, id
  FROM permissions
  ON CONFLICT DO NOTHING;

  INSERT INTO membership_roles (membership_id, role_id)
  VALUES (v_membership_id, v_role_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO subscription_plans (
    slug,
    name,
    plan_kind,
    price_cents,
    currency,
    limits_json,
    features_json
  )
  VALUES
    ('base-free', 'Base Free', 'base', 0, 'EUR', '{"employees":10}'::jsonb, '{"base_workspace":true}'::jsonb),
    ('contracts-pro-demo', 'Contracts Pro Demo', 'extension', 0, 'EUR', '{"templates":10,"submissions_per_month":30}'::jsonb, '{"contracts":true}'::jsonb),
    ('ticketing-pro-demo', 'Ticketing Pro Demo', 'extension', 0, 'EUR', '{"tasks_per_month":200}'::jsonb, '{"ticketing":true}'::jsonb)
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    plan_kind = EXCLUDED.plan_kind,
    price_cents = EXCLUDED.price_cents,
    currency = EXCLUDED.currency,
    limits_json = EXCLUDED.limits_json,
    features_json = EXCLUDED.features_json,
    active = true,
    updated_at = now();

  SELECT id INTO v_base_plan_id FROM subscription_plans WHERE slug = 'base-free';
  SELECT id INTO v_contracts_plan_id FROM subscription_plans WHERE slug = 'contracts-pro-demo';
  SELECT id INTO v_ticketing_plan_id FROM subscription_plans WHERE slug = 'ticketing-pro-demo';

  INSERT INTO feature_definitions (
    feature_key,
    name,
    package_name,
    category,
    description,
    default_limits_json
  )
  VALUES
    ('documents', 'Documents', 'Base Workspace', 'base', 'Organisation files and document records.', '{}'::jsonb),
    ('workspace_notes', 'Workspace Notes', 'Base Workspace', 'base', 'Personal and shared workspace notes.', '{}'::jsonb),
    ('contracts', 'Contracts Pro', 'Contracts Package', 'extension', 'Templates, invites, signing submissions, and generated contract records.', '{"templates":10,"submissions_per_month":30}'::jsonb),
    ('ticketing', 'Ticketing Pro', 'Ticketing Package', 'extension', 'Operational tickets and task pipeline.', '{"tasks_per_month":200}'::jsonb),
    ('internal_chat', 'Internal Chat', 'Internal Chat Package', 'extension', 'Internal workspace conversations and messages.', '{}'::jsonb),
    ('hr', 'HR Pro', 'HR Package', 'extension', 'Time tracking, leave requests, reviews, and certificate requests.', '{}'::jsonb)
  ON CONFLICT (feature_key) DO UPDATE
  SET
    name = EXCLUDED.name,
    package_name = EXCLUDED.package_name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    default_limits_json = EXCLUDED.default_limits_json,
    active = true,
    updated_at = now();

  SELECT id INTO v_documents_feature_id FROM feature_definitions WHERE feature_key = 'documents';
  SELECT id INTO v_workspace_notes_feature_id FROM feature_definitions WHERE feature_key = 'workspace_notes';
  SELECT id INTO v_contracts_feature_id FROM feature_definitions WHERE feature_key = 'contracts';
  SELECT id INTO v_ticketing_feature_id FROM feature_definitions WHERE feature_key = 'ticketing';
  SELECT id INTO v_internal_chat_feature_id FROM feature_definitions WHERE feature_key = 'internal_chat';
  SELECT id INTO v_hr_feature_id FROM feature_definitions WHERE feature_key = 'hr';

  INSERT INTO plan_features (subscription_plan_id, feature_definition_id, limits_json)
  VALUES
    (v_base_plan_id, v_documents_feature_id, '{}'::jsonb),
    (v_base_plan_id, v_workspace_notes_feature_id, '{}'::jsonb),
    (v_contracts_plan_id, v_contracts_feature_id, '{"templates":10,"submissions_per_month":30}'::jsonb),
    (v_ticketing_plan_id, v_ticketing_feature_id, '{"tasks_per_month":200}'::jsonb),
    (v_ticketing_plan_id, v_internal_chat_feature_id, '{}'::jsonb),
    (v_ticketing_plan_id, v_hr_feature_id, '{}'::jsonb)
  ON CONFLICT (subscription_plan_id, feature_definition_id) DO UPDATE
  SET limits_json = EXCLUDED.limits_json;

  INSERT INTO subscriptions (
    organisation_id,
    subscription_plan_id,
    status,
    current_period_start,
    current_period_end
  )
  SELECT v_org_id, plan_id, 'active', date_trunc('month', now()), date_trunc('month', now()) + interval '1 month'
  FROM (VALUES (v_base_plan_id), (v_contracts_plan_id), (v_ticketing_plan_id)) AS p(plan_id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.organisation_id = v_org_id
      AND s.subscription_plan_id = p.plan_id
      AND s.status = 'active'
  );

  INSERT INTO organisation_features (organisation_id, feature_definition_id, enabled, source)
  VALUES
    (v_org_id, v_documents_feature_id, true, 'manual'),
    (v_org_id, v_workspace_notes_feature_id, true, 'manual'),
    (v_org_id, v_contracts_feature_id, true, 'manual'),
    (v_org_id, v_ticketing_feature_id, true, 'manual'),
    (v_org_id, v_internal_chat_feature_id, true, 'manual'),
    (v_org_id, v_hr_feature_id, true, 'manual')
  ON CONFLICT (organisation_id, feature_definition_id) DO UPDATE
  SET enabled = EXCLUDED.enabled, source = EXCLUDED.source, updated_at = now();

  INSERT INTO organisation_feature_limits (
    organisation_id,
    feature_definition_id,
    limit_key,
    limit_value,
    period
  )
  VALUES
    (v_org_id, v_contracts_feature_id, 'templates', 10, 'none'),
    (v_org_id, v_contracts_feature_id, 'submissions', 30, 'monthly'),
    (v_org_id, v_ticketing_feature_id, 'tasks', 200, 'monthly')
  ON CONFLICT (organisation_id, feature_definition_id, limit_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value, period = EXCLUDED.period, updated_at = now();

  SELECT id INTO v_client_person_id
  FROM clients
  WHERE organisation_id = v_org_id
    AND cnp = '1900101123456'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_client_person_id IS NULL THEN
    INSERT INTO clients (
      organisation_id,
      owner_user_id,
      client_type,
      first_name,
      last_name,
      cnp,
      email,
      phone,
      address,
      status
    )
    VALUES (
      v_org_id,
      v_membership_id,
      'person',
      'Andrei',
      'Popescu',
      '1900101123456',
      'andrei.popescu@example.local',
      '+40711111111',
      'Cluj-Napoca, Romania',
      'active'
    )
    RETURNING id INTO v_client_person_id;
  ELSE
    UPDATE clients
    SET
      owner_user_id = v_membership_id,
      client_type = 'person',
      first_name = 'Andrei',
      last_name = 'Popescu',
      email = 'andrei.popescu@example.local',
      phone = '+40711111111',
      address = 'Cluj-Napoca, Romania',
      status = 'active',
      updated_at = now()
    WHERE id = v_client_person_id
    RETURNING id INTO v_client_person_id;
  END IF;

  SELECT id INTO v_client_company_id
  FROM clients
  WHERE organisation_id = v_org_id
    AND cui = 'RO12345678'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_client_company_id IS NULL THEN
    INSERT INTO clients (
      organisation_id,
      owner_user_id,
      client_type,
      company_name,
      cui,
      tva,
      responsible_name,
      responsible_email,
      email,
      phone,
      address,
      status
    )
    VALUES (
      v_org_id,
      v_membership_id,
      'company',
      'Acme Services SRL',
      'RO12345678',
      true,
      'Maria Ionescu',
      'maria.ionescu@acme.example.local',
      'office@acme.example.local',
      '+40722222222',
      'Timisoara, Romania',
      'active'
    )
    RETURNING id INTO v_client_company_id;
  ELSE
    UPDATE clients
    SET
      owner_user_id = v_membership_id,
      client_type = 'company',
      company_name = 'Acme Services SRL',
      tva = true,
      responsible_name = 'Maria Ionescu',
      responsible_email = 'maria.ionescu@acme.example.local',
      email = 'office@acme.example.local',
      phone = '+40722222222',
      address = 'Timisoara, Romania',
      status = 'active',
      updated_at = now()
    WHERE id = v_client_company_id
    RETURNING id INTO v_client_company_id;
  END IF;

  INSERT INTO files (
    organisation_id,
    uploaded_by_id,
    storage_key,
    original_name,
    mime_type,
    size_bytes,
    checksum_sha256,
    category
  )
  VALUES (
    v_org_id,
    v_membership_id,
    'demo/contracts/service-agreement.pdf',
    'service-agreement.pdf',
    'application/pdf',
    24576,
    'demo-checksum-service-agreement',
    'contracts'
  )
  ON CONFLICT (storage_key) DO UPDATE
  SET
    original_name = EXCLUDED.original_name,
    mime_type = EXCLUDED.mime_type,
    size_bytes = EXCLUDED.size_bytes,
    checksum_sha256 = EXCLUDED.checksum_sha256,
    category = EXCLUDED.category,
    deleted_at = NULL
  RETURNING id INTO v_file_id;

  SELECT id INTO v_org_document_id
  FROM organisation_documents
  WHERE organisation_id = v_org_id
    AND file_id = v_file_id
    AND document_name = 'Demo organisation document'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_org_document_id IS NULL THEN
    INSERT INTO organisation_documents (
      organisation_id,
      file_id,
      uploaded_by_id,
      document_name,
      document_type,
      visibility,
      remarks
    )
    VALUES (
      v_org_id,
      v_file_id,
      v_membership_id,
      'Demo organisation document',
      'internal',
      'organisation',
      'Seeded organisation-level document.'
    )
    RETURNING id INTO v_org_document_id;
  END IF;

  SELECT id INTO v_client_document_id
  FROM client_documents
  WHERE organisation_id = v_org_id
    AND client_id = v_client_company_id
    AND file_id = v_file_id
    AND document_name = 'Demo client contract'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_client_document_id IS NULL THEN
    INSERT INTO client_documents (
      organisation_id,
      client_id,
      file_id,
      document_name,
      file_type,
      status,
      remarks
    )
    VALUES (
      v_org_id,
      v_client_company_id,
      v_file_id,
      'Demo client contract',
      'contract',
      'active',
      'Seeded client contract document.'
    )
    RETURNING id INTO v_client_document_id;
  END IF;

  SELECT id INTO v_template_id
  FROM contract_templates
  WHERE organisation_id = v_org_id
    AND name = 'Demo Service Agreement'
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_template_id IS NULL THEN
    INSERT INTO contract_templates (
      organisation_id,
      created_by_id,
      name,
      contract_type,
      content_json,
      status
    )
    VALUES (
      v_org_id,
      v_membership_id,
      'Demo Service Agreement',
      'service_agreement',
      '{
        "title": "Service Agreement",
        "fields": [
          {"key": "client_name", "label": "Client name", "type": "text"},
          {"key": "service_name", "label": "Service name", "type": "text"},
          {"key": "monthly_price", "label": "Monthly price", "type": "number"}
        ]
      }'::jsonb,
      'active'
    )
    RETURNING id INTO v_template_id;
  END IF;

  INSERT INTO contract_invites (
    organisation_id,
    template_id,
    client_id,
    created_by_id,
    token_hash,
    status,
    remarks,
    expiration_date,
    sent_at
  )
  VALUES (
    v_org_id,
    v_template_id,
    v_client_company_id,
    v_membership_id,
    'demo-contract-invite-token-hash',
    'signed',
    'Seeded signed invite.',
    now() + interval '30 days',
    now() - interval '2 days'
  )
  ON CONFLICT (token_hash) DO UPDATE
  SET
    status = EXCLUDED.status,
    remarks = EXCLUDED.remarks,
    expiration_date = EXCLUDED.expiration_date,
    sent_at = EXCLUDED.sent_at,
    updated_at = now()
  RETURNING id INTO v_invite_id;

  INSERT INTO contract_submissions (
    organisation_id,
    invite_id,
    template_id,
    client_id,
    filled_fields,
    contract_number,
    pdf_file_id,
    status,
    signed_at
  )
  VALUES (
    v_org_id,
    v_invite_id,
    v_template_id,
    v_client_company_id,
    '{"client_name":"Acme Services SRL","service_name":"Monthly support","monthly_price":200}'::jsonb,
    '2026-0001',
    v_file_id,
    'signed',
    now() - interval '1 day'
  )
  ON CONFLICT (invite_id) DO UPDATE
  SET
    filled_fields = EXCLUDED.filled_fields,
    contract_number = EXCLUDED.contract_number,
    pdf_file_id = EXCLUDED.pdf_file_id,
    status = EXCLUDED.status,
    signed_at = EXCLUDED.signed_at,
    updated_at = now();

  INSERT INTO contract_numbers (organisation_id, year, last_number)
  VALUES (v_org_id, 2026, 1)
  ON CONFLICT (organisation_id, year) DO UPDATE
  SET last_number = GREATEST(contract_numbers.last_number, EXCLUDED.last_number);

  IF NOT EXISTS (
    SELECT 1
    FROM workspace_notes
    WHERE organisation_id = v_org_id
      AND owner_user_id = v_membership_id
      AND title = 'Demo shared note'
      AND deleted_at IS NULL
  ) THEN
    INSERT INTO workspace_notes (
      organisation_id,
      owner_user_id,
      client_id,
      visibility,
      title,
      body,
      pinned
    )
    VALUES (
      v_org_id,
      v_membership_id,
      v_client_company_id,
      'shared',
      'Demo shared note',
      'This note is visible to the workspace and attached to the demo company client.',
      true
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM ticketing_tasks
    WHERE organisation_id = v_org_id
      AND title = 'Review demo contract'
      AND deleted_at IS NULL
  ) THEN
    INSERT INTO ticketing_tasks (
      organisation_id,
      created_by_id,
      assignee_user_id,
      client_id,
      title,
      description,
      status,
      priority,
      source_type,
      source_id,
      due_at
    )
    VALUES (
      v_org_id,
      v_membership_id,
      v_membership_id,
      v_client_company_id,
      'Review demo contract',
      'Check the seeded service agreement and prepare the next client follow-up.',
      'todo',
      'high',
      'contract',
      v_invite_id,
      now() + interval '7 days'
    );
  END IF;

  INSERT INTO events (
    organisation_id,
    actor_type,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    data
  )
  VALUES (
    v_org_id,
    'seed',
    v_membership_id,
    'demo.seeded',
    'organisation',
    v_org_id,
    '{"source":"backend/configs/seed.sql"}'::jsonb
  );
END $$;
