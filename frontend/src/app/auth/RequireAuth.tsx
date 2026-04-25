import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../../hooks/useMe";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data } = useMe();
  const location = useLocation();

  if (!data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
