import { useNavigate } from "react-router-dom";
import { UserCog, LogOut } from "lucide-react";

const IMPERSONATE_KEY = "contapp_impersonate";

export function useImpersonation() {
  try {
    const s = sessionStorage.getItem(IMPERSONATE_KEY);
    if (!s) return null;
    return JSON.parse(s) as { userId: string; userName: string; userEmail: string };
  } catch {
    return null;
  }
}

export function clearImpersonation() {
  sessionStorage.removeItem(IMPERSONATE_KEY);
  sessionStorage.removeItem("contapp_mock_auth");
}

export function ImpersonationBanner() {
  const imp = useImpersonation();
  const navigate = useNavigate();

  if (!imp) return null;

  const handleExit = () => {
    clearImpersonation();
    navigate("/app/dashboard");
  };

  return (
    <div
      className="bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-800 dark:text-yellow-200 flex items-center justify-between px-4 py-2 text-sm"
      role="alert"
    >
      <span className="flex items-center gap-2">
        <UserCog className="w-4 h-4 shrink-0" />
        <strong>Impersonare:</strong> {imp.userName} ({imp.userEmail})
      </span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 font-medium transition-colors"
      >
        <LogOut className="w-4 h-4" /> Ieși din impersonare
      </button>
    </div>
  );
}
