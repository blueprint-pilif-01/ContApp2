import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePrincipal } from "../../hooks/useMe";

/**
 * Guards `/admin/*` routes. Redirects non-admin sessions to `/admin/login`.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const principal = usePrincipal();
  const location = useLocation();

  if (!principal) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (principal.kind !== "admin") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
