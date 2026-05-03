import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { logout, useAdminMe } from "../../hooks/useMe";
import { queryClient } from "../../lib/queryClient";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell() {
  const { data: principal } = useAdminMe();
  const navigate = useNavigate();
  const adminName =
    principal?.kind === "admin"
      ? `${principal.first_name} ${principal.last_name}`.trim() || principal.email
      : "Platform Admin";
  const adminEmail = principal?.kind === "admin" ? principal.email : "";

  const handleSignOut = async () => {
    try {
      await logout("admin");
    } finally {
      queryClient.clear();
      navigate("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <header className="h-14 px-6 border-b border-border bg-frame flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Admin Console
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={adminName} size="sm" status="online" />
              <div className="text-right leading-tight hidden md:block">
                <p className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                  {adminName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {adminEmail}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" />
              Ieșire
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
