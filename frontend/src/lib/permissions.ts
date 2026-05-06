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
  permission("dashboard:read", "Vezi dashboard", "Poate vedea dashboard-ul workspace-ului.", "workspace"),
  permission("activity_log:read", "Vezi activitate", "Poate vedea jurnalul de activitate.", "workspace"),
  permission("reports:read", "Vezi rapoarte", "Poate vedea rapoartele operationale.", "workspace"),
  permission("reports:export", "Exporta rapoarte", "Poate exporta rapoarte.", "workspace"),
  permission("notifications:read", "Vezi notificari", "Poate citi notificarile.", "workspace"),
  permission("notifications:manage", "Gestioneaza notificari", "Poate marca si administra notificari.", "workspace"),

  permission("clients:read", "Vezi clienti", "Poate lista si deschide clienti.", "clients"),
  permission("clients:create", "Creeaza clienti", "Poate crea clienti noi.", "clients"),
  permission("clients:update", "Editeaza clienti", "Poate modifica datele clientilor.", "clients"),
  permission("clients:archive", "Arhiveaza clienti", "Poate arhiva/dezarhiva clienti.", "clients"),
  permission("clients:delete", "Sterge clienti", "Poate sterge clienti.", "clients"),
  permission("clients:export", "Exporta clienti", "Poate exporta lista de clienti.", "clients"),
  permission("clients:portal_invite", "Invita client in portal", "Poate trimite invitatii de portal client.", "clients"),
  permission("clients:contacts_read", "Vezi contacte client", "Poate vedea contactele clientului.", "clients"),
  permission("clients:contacts_manage", "Gestioneaza contacte client", "Poate crea si edita contacte de client.", "clients"),

  permission("documents:read", "Vezi documente", "Poate citi documentele workspace-ului.", "documents"),
  permission("documents:upload", "Incarca documente", "Poate incarca fisiere.", "documents"),
  permission("documents:update", "Editeaza documente", "Poate redenumi si actualiza metadata.", "documents"),
  permission("documents:move", "Muta documente", "Poate muta fisiere intre foldere.", "documents"),
  permission("documents:archive", "Arhiveaza documente", "Poate arhiva documente.", "documents"),
  permission("documents:delete", "Sterge documente", "Poate sterge documente.", "documents"),
  permission("documents:export", "Exporta documente", "Poate descarca/exporta documente.", "documents"),
  permission("documents:gdrive_connect", "Conecteaza Google Drive", "Poate conecta Google Drive la workspace.", "documents"),
  permission("documents:gdrive_read", "Vezi Google Drive", "Poate vedea fisiere din Google Drive.", "documents"),
  permission("documents:gdrive_import", "Importa din Google Drive", "Poate importa metadata/fisiere din Google Drive.", "documents"),

  permission("contracts:read", "Vezi contracte", "Poate vedea contracte si sabloane.", "contracts"),
  permission("contracts:create", "Creeaza contracte", "Poate crea sabloane si contracte.", "contracts"),
  permission("contracts:update", "Editeaza contracte", "Poate modifica sabloane si contracte.", "contracts"),
  permission("contracts:archive", "Arhiveaza contracte", "Poate arhiva contracte.", "contracts"),
  permission("contracts:delete", "Sterge contracte", "Poate sterge contracte.", "contracts"),
  permission("contracts:send_invite", "Trimite solicitari", "Poate trimite invitatii de semnare.", "contracts"),
  permission("contracts:revoke_invite", "Revoca solicitari", "Poate revoca invitatii de semnare.", "contracts"),
  permission("contracts:view_submissions", "Vezi submisii", "Poate vedea contractele semnate.", "contracts"),
  permission("contracts:create_submission", "Creeaza submisii", "Poate inregistra semnari manuale.", "contracts"),
  permission("contracts:download_pdf", "Descarca PDF", "Poate descarca PDF-ul contractului.", "contracts"),
  permission("contracts:download_signature", "Descarca semnatura", "Poate descarca imaginea semnaturii.", "contracts"),

  permission("ticketing:read", "Vezi tickete", "Poate vedea ticketing-ul intern.", "ticketing"),
  permission("ticketing:create", "Creeaza tickete", "Poate crea tickete interne.", "ticketing"),
  permission("ticketing:update", "Editeaza tickete", "Poate modifica tickete.", "ticketing"),
  permission("ticketing:assign", "Asigneaza tickete", "Poate asigna tickete catre angajati.", "ticketing"),
  permission("ticketing:claim", "Preia tickete", "Poate prelua tickete.", "ticketing"),
  permission("ticketing:complete", "Finalizeaza tickete", "Poate marca tickete ca finalizate.", "ticketing"),
  permission("ticketing:refuse", "Refuza tickete", "Poate refuza/bloca tickete.", "ticketing"),
  permission("ticketing:archive", "Arhiveaza tickete", "Poate arhiva tickete.", "ticketing"),
  permission("ticketing:restore", "Restaureaza tickete", "Poate restaura tickete arhivate.", "ticketing"),
  permission("ticketing:delete", "Sterge tickete", "Poate sterge tickete.", "ticketing"),
  permission("ticketing:view_audit", "Vezi audit ticket", "Poate vedea istoricul complet al ticketelor.", "ticketing"),

  permission("chat:read", "Vezi chat", "Poate vedea conversatii.", "chat"),
  permission("chat:send", "Trimite mesaje", "Poate trimite mesaje.", "chat"),
  permission("chat:create_direct", "Creeaza DM", "Poate crea conversatii directe.", "chat"),
  permission("chat:create_group", "Creeaza grup", "Poate crea grupuri de chat.", "chat"),
  permission("chat:create_team_group", "Creeaza grup de echipa", "Poate crea chat pentru o echipa.", "chat"),
  permission("chat:manage_participants", "Gestioneaza participanti", "Poate adauga/scoate participanti.", "chat"),
  permission("chat:manage_templates", "Gestioneaza sabloane chat", "Poate crea si sterge sabloane de mesaj.", "chat"),
  permission("chat:derive_ticket", "Creeaza ticket din chat", "Poate deriva tickete din conversatii.", "chat"),

  permission("notebook:read", "Vezi notebook", "Poate vedea documente notebook.", "notebook"),
  permission("notebook:create", "Creeaza notebook", "Poate crea documente notebook.", "notebook"),
  permission("notebook:update", "Editeaza notebook", "Poate edita documente notebook.", "notebook"),
  permission("notebook:delete", "Sterge notebook", "Poate sterge documente notebook.", "notebook"),
  permission("notebook:share_team", "Partajeaza notebook cu echipa", "Poate partaja documente catre echipe.", "notebook"),
  permission("workspace_notes:read", "Vezi note", "Poate vedea note de workspace.", "notebook"),
  permission("workspace_notes:create", "Creeaza note", "Poate crea note.", "notebook"),
  permission("workspace_notes:update", "Editeaza note", "Poate edita note.", "notebook"),
  permission("workspace_notes:delete", "Sterge note", "Poate sterge note.", "notebook"),
  permission("workspace_notes:share_team", "Partajeaza note cu echipa", "Poate partaja note catre echipe.", "notebook"),

  permission("hr:read_self", "Vezi HR personal", "Poate vedea propriile date HR.", "hr"),
  permission("hr:read_team", "Vezi HR echipa", "Poate vedea datele HR ale echipei.", "hr"),
  permission("hr:read_all", "Vezi tot HR", "Poate vedea datele HR ale intregului workspace.", "hr"),
  permission("hr:time_create_self", "Ponteaza personal", "Poate inregistra pontaj propriu.", "hr"),
  permission("hr:time_create_for_team", "Ponteaza pentru echipa", "Poate inregistra pontaj pentru echipa.", "hr"),
  permission("hr:time_approve", "Aproba pontaj", "Poate aproba/respingere pontaj.", "hr"),
  permission("hr:leave_request", "Cere concediu", "Poate trimite cereri de concediu.", "hr"),
  permission("hr:leave_approve", "Aproba concedii", "Poate aproba/respingere concedii.", "hr"),
  permission("hr:certificate_request", "Cere adeverinta", "Poate solicita adeverinte.", "hr"),
  permission("hr:certificate_approve", "Aproba adeverinte", "Poate aproba/respingere adeverinte.", "hr"),
  permission("hr:reviews_read", "Vezi review-uri", "Poate citi review-uri HR.", "hr"),
  permission("hr:reviews_manage", "Gestioneaza review-uri", "Poate crea si edita review-uri HR.", "hr"),
  permission("hr:overtime_manage", "Gestioneaza overtime", "Poate administra ore suplimentare.", "hr"),

  permission("members:read", "Vezi angajati", "Poate vedea angajatii.", "people"),
  permission("members:create", "Creeaza angajati", "Poate crea angajati.", "people"),
  permission("members:update", "Editeaza angajati", "Poate actualiza angajati.", "people"),
  permission("members:invite", "Invita angajati", "Poate trimite invitatii.", "people"),
  permission("members:suspend", "Suspenda angajati", "Poate suspenda/reactiva angajati.", "people"),
  permission("members:delete", "Sterge angajati", "Poate elimina angajati.", "people"),
  permission("employee_categories:read", "Vezi categorii", "Poate vedea categorii de angajati.", "people"),
  permission("employee_categories:create", "Creeaza categorii", "Poate crea categorii de angajati.", "people"),
  permission("employee_categories:update", "Editeaza categorii", "Poate edita categorii de angajati.", "people"),
  permission("employee_categories:delete", "Sterge categorii", "Poate sterge categorii de angajati.", "people"),
  permission("teams:read", "Vezi echipe", "Poate vedea echipe.", "people"),
  permission("teams:create", "Creeaza echipe", "Poate crea echipe.", "people"),
  permission("teams:update", "Editeaza echipe", "Poate edita echipe.", "people"),
  permission("teams:delete", "Sterge echipe", "Poate sterge echipe.", "people"),
  permission("teams:assign_members", "Asigneaza membri in echipe", "Poate modifica membrii echipelor.", "people"),
  permission("roles:read", "Vezi roluri", "Poate vedea roluri.", "people"),
  permission("roles:create", "Creeaza roluri", "Poate crea roluri.", "people"),
  permission("roles:update", "Editeaza roluri", "Poate edita roluri.", "people"),
  permission("roles:delete", "Sterge roluri", "Poate sterge roluri.", "people"),
  permission("roles:assign", "Asigneaza roluri", "Poate asigna roluri catre angajati.", "people"),
  permission("permissions:read", "Vezi permisiuni", "Poate vedea catalogul de permisiuni.", "people"),
  permission("permissions:preview_effective", "Previzualizeaza permisiuni", "Poate vedea permisiunile efective.", "people"),

  permission("billing:read", "Vezi billing", "Poate vedea billing si abonament.", "billing"),
  permission("billing:manage", "Gestioneaza billing", "Poate administra billing.", "billing"),
  permission("plans:read", "Vezi planuri", "Poate vedea planurile disponibile.", "billing"),
  permission("plans:change", "Schimba plan", "Poate initia schimbarea planului.", "billing"),
  permission("extensions:read", "Vezi extensii", "Poate vedea extensiile active.", "billing"),
  permission("extensions:manage", "Gestioneaza extensii", "Poate activa/dezactiva extensii.", "billing"),

  permission("settings:read", "Vezi setari", "Poate vedea setarile.", "settings"),
  permission("settings:update_workspace", "Editeaza workspace", "Poate modifica setarile workspace-ului.", "settings"),
  permission("profile:update_self", "Editeaza profil propriu", "Poate edita propriul profil.", "settings"),
  permission("profile:update_others", "Editeaza profiluri", "Poate edita profilurile altor angajati.", "settings"),
  permission("signature:read", "Vezi semnaturi", "Poate vedea semnaturi salvate.", "settings"),
  permission("signature:create", "Creeaza semnaturi", "Poate crea semnaturi.", "settings"),
  permission("signature:update", "Editeaza semnaturi", "Poate actualiza semnaturi.", "settings"),
  permission("signature:delete", "Sterge semnaturi", "Poate sterge semnaturi.", "settings"),

  permission("calendar:read", "Vezi calendar", "Poate vedea calendarul.", "automation"),
  permission("calendar:create", "Creeaza evenimente", "Poate crea evenimente calendar.", "automation"),
  permission("calendar:update", "Editeaza evenimente", "Poate edita evenimente calendar.", "automation"),
  permission("calendar:delete", "Sterge evenimente", "Poate sterge evenimente calendar.", "automation"),
  permission("automations:read", "Vezi automatizari", "Poate vedea automatizari.", "automation"),
  permission("automations:create", "Creeaza automatizari", "Poate crea automatizari.", "automation"),
  permission("automations:update", "Editeaza automatizari", "Poate edita automatizari.", "automation"),
  permission("automations:delete", "Sterge automatizari", "Poate sterge automatizari.", "automation"),
  permission("ai:use", "Foloseste AI", "Poate folosi functionalitati AI.", "automation"),
  permission("ai:configure", "Configureaza AI", "Poate configura functionalitati AI.", "automation"),
];

export const PERMISSION_BY_SLUG = Object.fromEntries(
  PERMISSION_CATALOG.map((item) => [item.slug, item])
) as Record<string, PermissionDefinition>;

export const LEGACY_PERMISSION_ALIASES: Record<string, string[]> = {
  "clients:write": ["clients:create", "clients:update", "clients:archive", "clients:contacts_manage", "clients:portal_invite"],
  "documents:write": ["documents:upload", "documents:update", "documents:move", "documents:archive", "documents:gdrive_connect", "documents:gdrive_import"],
  "contracts:write": ["contracts:create", "contracts:update", "contracts:archive", "contracts:send_invite", "contracts:revoke_invite", "contracts:create_submission"],
  "ticketing:write": ["ticketing:create", "ticketing:update", "ticketing:assign", "ticketing:claim", "ticketing:complete", "ticketing:refuse", "ticketing:archive", "ticketing:restore"],
  "members:write": ["members:create", "members:update", "members:invite", "members:suspend", "teams:create", "teams:update", "teams:assign_members", "employee_categories:create", "employee_categories:update"],
  "roles:write": ["roles:create", "roles:update", "roles:delete", "roles:assign", "permissions:preview_effective"],
  "employee_categories:write": ["employee_categories:create", "employee_categories:update"],
  "workspace_notes:write": ["workspace_notes:create", "workspace_notes:update", "workspace_notes:share_team"],
  "notebook:write": ["notebook:create", "notebook:update", "notebook:share_team"],
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
