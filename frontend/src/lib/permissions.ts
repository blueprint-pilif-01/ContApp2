export interface PermissionGroup {
  id: string;
  label: string;
  description: string;
}

export interface PermissionDefinition {
  slug: string;
  label: string;
  description: string;
  group: string;
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Dashboard, rapoarte, activitate si notificari.",
  },
  {
    id: "clients",
    label: "Clienti",
    description: "Administrarea clientilor si accesul de portal.",
  },
  {
    id: "documents",
    label: "Documente",
    description: "Fisiere locale, foldere si integrare Google Drive.",
  },
  {
    id: "contracts",
    label: "Contracte",
    description: "Sabloane, solicitari, semnari si submisii.",
  },
  {
    id: "ticketing",
    label: "Ticketing",
    description: "Work items interne si audit operational.",
  },
  {
    id: "chat",
    label: "Chat",
    description: "Mesaje, conversatii, grupuri si template-uri.",
  },
  {
    id: "notebook",
    label: "Notebook",
    description: "Note personale, note partajate si documente notebook.",
  },
  {
    id: "hr",
    label: "HR",
    description: "Pontaj, concedii, adeverinte, overtime si review-uri.",
  },
  {
    id: "people",
    label: "Angajati si roluri",
    description: "Utilizatori, echipe, categorii, roluri si permisiuni.",
  },
  {
    id: "billing",
    label: "Planuri si extensii",
    description: "Abonament, planuri, limite si extensii.",
  },
  {
    id: "settings",
    label: "Setari",
    description: "Profil, workspace si semnaturi.",
  },
  {
    id: "automation",
    label: "Automatizari si AI",
    description: "Calendar, automatizari si functii AI.",
  },
];

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  permission("activity_log:read", "Vezi activitate", "Poate vedea jurnalul de activitate.", "workspace"),
  permission("reports:read", "Vezi rapoarte", "Poate vedea rapoartele operationale.", "workspace"),

  permission("clients:read", "Vezi clienti", "Poate lista si deschide clienti.", "clients"),
  permission("clients:write", "Creeaza si editeaza clienti", "Poate crea si modifica datele clientilor.", "clients"),
  permission("clients:delete", "Sterge clienti", "Poate sterge clienti.", "clients"),

  permission("documents:read", "Vezi documente", "Poate citi documentele workspace-ului.", "documents"),
  permission("documents:write", "Creeaza si editeaza documente", "Poate incarca si actualiza documente.", "documents"),
  permission("documents:delete", "Sterge documente", "Poate sterge documente.", "documents"),

  permission("contracts:read", "Vezi contracte", "Poate vedea contracte si sabloane.", "contracts"),
  permission("contracts:write", "Creeaza si editeaza contracte", "Poate crea si modifica sabloane, solicitari si submisii.", "contracts"),
  permission("contracts:delete", "Sterge contracte", "Poate sterge contracte.", "contracts"),

  permission("ticketing:read", "Vezi tickete", "Poate vedea ticketing-ul intern.", "ticketing"),
  permission("ticketing:write", "Creeaza si editeaza tickete", "Poate crea, modifica si procesa tickete.", "ticketing"),
  permission("ticketing:delete", "Sterge tickete", "Poate sterge tickete.", "ticketing"),

  permission("chat:read", "Vezi chat", "Poate vedea conversatii.", "chat"),
  permission("chat:write", "Trimite mesaje", "Poate trimite mesaje.", "chat"),
  permission("message_templates:read", "Vezi sabloane mesaj", "Poate vedea sabloane de mesaj.", "chat"),
  permission("message_templates:write", "Creeaza sabloane mesaj", "Poate crea sabloane de mesaj.", "chat"),
  permission("message_templates:delete", "Sterge sabloane mesaj", "Poate sterge sabloane de mesaj.", "chat"),

  permission("workspace_notes:read", "Vezi note", "Poate vedea note de workspace.", "notebook"),
  permission("workspace_notes:write", "Creeaza si editeaza note", "Poate crea si edita note.", "notebook"),
  permission("workspace_notes:delete", "Sterge note", "Poate sterge note.", "notebook"),

  permission("hr:read", "Vezi HR", "Poate vedea date HR.", "hr"),
  permission("hr:write", "Creeaza si editeaza HR", "Poate crea si modifica date HR.", "hr"),

  permission("members:read", "Vezi angajati", "Poate vedea angajatii.", "people"),
  permission("members:write", "Creeaza si editeaza angajati", "Poate crea, invita si actualiza angajati.", "people"),
  permission("members:delete", "Sterge angajati", "Poate elimina angajati.", "people"),
  permission("employee_categories:read", "Vezi categorii", "Poate vedea categorii de angajati.", "people"),
  permission("employee_categories:write", "Creeaza si editeaza categorii", "Poate crea si edita categorii de angajati.", "people"),
  permission("employee_categories:delete", "Sterge categorii", "Poate sterge categorii de angajati.", "people"),
  permission("roles:read", "Vezi roluri", "Poate vedea roluri.", "people"),
  permission("roles:write", "Creeaza, editeaza si asigneaza roluri", "Poate administra roluri si asignari.", "people"),

  permission("planner:read", "Vezi planner", "Poate vedea evenimente planner.", "automation"),
  permission("planner:write", "Creeaza si editeaza planner", "Poate crea si modifica evenimente planner.", "automation"),
  permission("planner:delete", "Sterge planner", "Poate sterge evenimente planner.", "automation"),
  permission("automation_rules:read", "Vezi automatizari", "Poate vedea reguli de automatizare si sugestii AI.", "automation"),
  permission("automation_rules:write", "Creeaza si editeaza automatizari", "Poate crea si modifica reguli de automatizare.", "automation"),
  permission("automation_rules:delete", "Sterge automatizari", "Poate sterge reguli de automatizare.", "automation"),
];

export const PERMISSION_BY_SLUG = Object.fromEntries(
  PERMISSION_CATALOG.map((item) => [item.slug, item])
) as Record<string, PermissionDefinition>;

export const LEGACY_PERMISSION_ALIASES: Record<string, string[]> = {
  "clients:write": ["clients:create", "clients:update", "clients:archive", "clients:contacts_manage", "clients:portal_invite"],
  "documents:write": ["documents:upload", "documents:update", "documents:move", "documents:archive", "documents:gdrive_connect", "documents:gdrive_import"],
  "contracts:write": ["contracts:create", "contracts:update", "contracts:archive", "contracts:send_invite", "contracts:revoke_invite", "contracts:create_submission"],
  "ticketing:write": ["ticketing:create", "ticketing:update", "ticketing:assign", "ticketing:claim", "ticketing:complete", "ticketing:refuse", "ticketing:archive", "ticketing:restore"],
  "chat:write": ["chat:send", "chat:create_direct", "chat:create_group", "chat:create_team_group", "chat:manage_participants", "chat:derive_ticket"],
  "message_templates:write": ["chat:manage_templates"],
  "members:write": ["members:create", "members:update", "members:invite", "members:suspend", "teams:create", "teams:update", "teams:assign_members", "employee_categories:create", "employee_categories:update"],
  "roles:write": ["roles:create", "roles:update", "roles:delete", "roles:assign", "permissions:preview_effective"],
  "employee_categories:write": ["employee_categories:create", "employee_categories:update"],
  "workspace_notes:write": ["workspace_notes:create", "workspace_notes:update", "workspace_notes:share_team"],
  "notebook:write": ["notebook:create", "notebook:update", "notebook:share_team"],
  "hr:read": ["hr:read_self", "hr:read_team", "hr:read_all", "hr:reviews_read"],
  "hr:write": ["hr:manage", "hr:time_create_self", "hr:time_create_for_team", "hr:time_approve", "hr:leave_request", "hr:leave_approve", "hr:certificate_request", "hr:certificate_approve", "hr:reviews_manage", "hr:overtime_manage"],
  "planner:read": ["calendar:read"],
  "planner:write": ["calendar:create", "calendar:update"],
  "planner:delete": ["calendar:delete"],
  "automation_rules:read": ["automations:read", "ai:use"],
  "automation_rules:write": ["automations:create", "automations:update", "ai:configure"],
  "automation_rules:delete": ["automations:delete"],
  "hr:manage": ["hr:read_team", "hr:read_all", "hr:time_create_for_team", "hr:time_approve", "hr:leave_approve", "hr:certificate_approve", "hr:reviews_manage", "hr:overtime_manage"],
  "ticketing:manage": ["ticketing:create", "ticketing:update", "ticketing:assign", "ticketing:claim", "ticketing:complete", "ticketing:refuse", "ticketing:archive", "ticketing:restore", "ticketing:delete", "ticketing:view_audit"],
  "users.manage": ["members:create", "members:update", "members:invite", "members:suspend", "members:delete", "roles:assign"],
  "billing.manage": ["billing:manage", "plans:change", "extensions:manage"],
  "settings:manage": ["settings:update_workspace", "profile:update_others", "signature:create", "signature:update", "signature:delete"],
};

export function permissionImplies(granted: string, required: string): boolean {
  if (granted === "*" || granted === required) return true;
  const implied = LEGACY_PERMISSION_ALIASES[granted] ?? [];
  return implied.includes(required);
}

export function hasPermissionSlug(granted: string[], required: string): boolean {
  return granted.some((permissionSlug) => permissionImplies(permissionSlug, required));
}

export function groupPermissions(groupID: string): PermissionDefinition[] {
  return PERMISSION_CATALOG.filter((permissionItem) => permissionItem.group === groupID);
}

export function permissionLabel(slug: string): string {
  return PERMISSION_BY_SLUG[slug]?.label ?? slug;
}

function permission(
  slug: string,
  label: string,
  description: string,
  group: string
): PermissionDefinition {
  return { slug, label, description, group };
}
