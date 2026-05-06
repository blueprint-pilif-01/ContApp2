import { describe, expect, it } from "vitest";
import {
  PERMISSION_CATALOG,
  hasPermissionSlug,
  permissionImplies,
} from "../src/lib/permissions";

describe("permission catalog", () => {
  it("lets wildcard permissions imply every granular permission", () => {
    expect(permissionImplies("*", "hr:approve_leave")).toBe(true);
    expect(hasPermissionSlug(["*"], "documents:gdrive_import")).toBe(true);
  });

  it("maps legacy write permissions to granular permissions", () => {
    expect(permissionImplies("documents:write", "documents:move")).toBe(true);
    expect(permissionImplies("ticketing:write", "ticketing:assign")).toBe(true);
    expect(permissionImplies("roles:write", "roles:assign")).toBe(true);
  });

  it("contains the extended people and Google Drive permissions", () => {
    const slugs = new Set(PERMISSION_CATALOG.map((permission) => permission.slug));
    expect(slugs.has("teams:assign_members")).toBe(true);
    expect(slugs.has("employee_categories:update")).toBe(true);
    expect(slugs.has("documents:gdrive_connect")).toBe(true);
  });
});
