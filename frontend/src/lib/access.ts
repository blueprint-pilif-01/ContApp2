import type { Principal } from "./session";
import { hasPermissionSlug } from "./permissions";

const ADMIN_ROLE_HINTS = [
  "owner",
  "admin",
  "administrator",
  "organisation_admin",
  "organization_admin",
  "proprietar",
];

const MANAGER_ROLE_HINTS = [
  ...ADMIN_ROLE_HINTS,
  "manager",
  "lead",
  "hr",
  "people",
  "resurse umane",
];

function roleText(principal: Principal | null | undefined): string {
  return principal?.role?.toLowerCase().trim() ?? "";
}

function roleIncludes(principal: Principal | null | undefined, hints: string[]): boolean {
  const role = roleText(principal);
  return hints.some((hint) => role.includes(hint));
}

export function isWorkspaceAdmin(principal: Principal | null | undefined): boolean {
  if (principal?.kind === "admin") return true;
  return roleIncludes(principal, ADMIN_ROLE_HINTS);
}

export function isWorkspaceManager(principal: Principal | null | undefined): boolean {
  if (principal?.kind === "admin") return true;
  return roleIncludes(principal, MANAGER_ROLE_HINTS);
}

export function hasWorkspacePermission(
  principal: Principal | null | undefined,
  permission: string
): boolean {
  if (!principal) return false;
  return hasPermissionSlug(principal.permissions, permission);
}

export function hasAnyWorkspacePermission(
  principal: Principal | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasWorkspacePermission(principal, permission));
}

export function canManageWorkspaceSettings(
  principal: Principal | null | undefined
): boolean {
  return (
    isWorkspaceAdmin(principal) ||
    hasAnyWorkspacePermission(principal, [
      "members:create",
      "members:update",
      "members:write",
      "roles:update",
      "roles:assign",
      "billing.manage",
    ])
  );
}

export function canManageHR(principal: Principal | null | undefined): boolean {
  return (
    isWorkspaceManager(principal) ||
    hasAnyWorkspacePermission(principal, ["hr:read_team", "hr:read_all", "hr.manage", "members:write"])
  );
}

export function canManageTicketing(principal: Principal | null | undefined): boolean {
  return (
    isWorkspaceManager(principal) ||
    hasAnyWorkspacePermission(principal, ["ticketing:update", "ticketing:assign", "ticketing.manage", "ticketing:write"])
  );
}

export function inferWorkspacePermissions(
  workspace: { role?: string; role_label?: string; permissions?: string[] } | null | undefined
): string[] {
  const explicit = Array.isArray(workspace?.permissions) ? workspace.permissions : [];
  if (explicit.length > 0) return explicit;

  const role = workspace?.role ?? workspace?.role_label ?? "";
  const normalized = role.toLowerCase();
  if (ADMIN_ROLE_HINTS.some((hint) => normalized.includes(hint))) return ["*"];
  if (MANAGER_ROLE_HINTS.some((hint) => normalized.includes(hint))) {
    return [
      "dashboard:read",
      "members:read",
      "teams:read",
      "ticketing:read",
      "ticketing:write",
      "hr:read_team",
      "hr:time_approve",
      "hr:leave_approve",
    ];
  }
  return ["dashboard:read", "profile:update_self", "hr:read_self", "hr:time_create_self", "hr:leave_request", "hr:certificate_request"];
}
