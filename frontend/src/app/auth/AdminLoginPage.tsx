import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "../../hooks/useMe";
import type { ApiError } from "../../lib/api";

interface LoginPayload {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/admin/dashboard";

  const [email, setEmail] = useState("admin@contapp.local");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");

  const loginMut = useMutation({
    mutationFn: (payload: LoginPayload) => loginAdmin(payload),
    onSuccess: () => {
      setApiError("");
      navigate(from, { replace: true });
    },
    onError: (e: ApiError) => {
      setApiError(e.message ?? "Email sau parolă incorectă.");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    loginMut.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,_#fef3c7_0%,_#fde68a_25%,_#fcd34d_55%,_#f59e0b_85%,_#b45309_100%)] dark:bg-[linear-gradient(145deg,_#1a1410_0%,_#241a10_30%,_#2e1a0d_55%,_#3a210b_80%,_#4a2a08_100%)] opacity-50" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </span>
        </div>

        <div className="bg-frame border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Admin Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-7">
            Autentificare pentru administratori platformă.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition"
              />
            </div>

            <div>
              <label htmlFor="pwd" className="block text-sm font-medium text-foreground mb-1.5">
                Parolă
              </label>
              <div className="relative">
                <input
                  id="pwd"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPwd ? "Ascunde parola" : "Arată parola"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {apiError && (
              <p className="text-sm text-red-500 bg-red-500/8 rounded-xl px-3.5 py-2.5">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 text-background rounded-xl text-sm font-semibold transition-colors mt-2 cursor-pointer"
            >
              {loginMut.isPending ? (
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <span>Intră în Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} ContApp · Admin Console
        </p>
      </div>
    </div>
  );
}
