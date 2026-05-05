import type { Principal } from "./session";

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

const PERMISSION_ALIASES: Record<string, string[]> = {
  "users.manage": ["members:write", "roles:write"],
  "ticketing.manage": ["ticketing:write", "ticketing:delete"],
  "hr.manage": ["members:write"],
  "hr.self": ["members:read"],
  "billing.manage": ["roles:write"],
};

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
  if (principal.permissions.includes("*")) return true;
  const accepted = new Set([permission, ...(PERMISSION_ALIASES[permission] ?? [])]);
  return principal.permissions.some((p) => accepted.has(p));
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
      "users.manage",
      "members:write",
      "roles:write",
      "billing.manage",
    ])
  );
}

export function canManageHR(principal: Principal | null | undefined): boolean {
  return (
    isWorkspaceManager(principal) ||
    hasAnyWorkspacePermission(principal, ["hr.manage", "members:write"])
  );
}

export function canManageTicketing(principal: Principal | null | undefined): boolean {
  return (
    isWorkspaceManager(principal) ||
    hasAnyWorkspacePermission(principal, ["ticketing.manage", "ticketing:write"])
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
    return ["members:read", "ticketing:read", "ticketing:write"];
  }
  return [];
}
