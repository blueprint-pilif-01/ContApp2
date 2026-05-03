import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../hooks/useMe";
import type { ApiError } from "../../lib/api";
import { AuthShell } from "./AuthShell";

interface LoginPayload {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/app/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");

  const loginMut = useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
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
    <AuthShell>
      <div className="bg-frame/90 dark:bg-frame/95 border border-border/80 backdrop-blur-sm rounded-[1.25rem] p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Bun venit înapoi.
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 mb-7">
          Autentifică-te pentru a accesa ContApp.
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
              placeholder="adresa@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30 focus:border-[color:var(--accent)]/45 transition-shadow"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pwd" className="text-sm font-medium text-foreground">
                Parolă
              </label>
            </div>
            <div className="relative">
              <input
                id="pwd"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30 focus:border-[color:var(--accent)]/45 transition-shadow"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
                aria-label={showPwd ? "Ascunde parola" : "Arată parola"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {apiError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-xl px-3.5 py-2.5">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMut.isPending}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 text-background rounded-xl text-sm font-semibold transition-[transform,box-shadow,opacity] active:scale-[0.988] shadow-sm cursor-pointer"
          >
            {loginMut.isPending ? (
              <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                <span>Intră în cont</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Încă nu ai cont?{" "}
            <Link
              to="/register"
              className="text-foreground font-medium hover:underline underline-offset-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/40"
            >
              Vezi înregistrarea
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/85 mt-2">
            Pentru echipe cu acces ridicat: conturile sunt adesea activate de administrator.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
