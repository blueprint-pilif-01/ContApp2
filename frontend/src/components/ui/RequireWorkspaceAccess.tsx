import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePrincipal } from "../../hooks/useMe";
import { canManageWorkspaceSettings } from "../../lib/access";

export function RequireWorkspaceSettingsAccess({ children }: { children: ReactNode }) {
  const principal = usePrincipal("user");
  if (!canManageWorkspaceSettings(principal)) {
    return <Navigate to="/app/settings" replace />;
  }
  return <>{children}</>;
}
