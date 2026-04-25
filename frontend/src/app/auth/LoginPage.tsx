import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../hooks/useMe";
import type { ApiError } from "../../lib/api";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,_#f0fdf4_0%,_#dcfce7_25%,_#bbf7d0_50%,_#86efac_75%,_#a8d946_100%)] dark:bg-[linear-gradient(145deg,_#0f1410_0%,_#152015_30%,_#1a2e1a_55%,_#1e3d1e_80%,_#243d10_100%)]" />
        <div className="absolute -top-24 -right-24 w-[24rem] h-[24rem] rounded-full bg-accent/45 dark:bg-accent/30 blur-[70px]" />
        <div className="absolute top-1/2 -left-20 w-[20rem] h-[20rem] rounded-full bg-accent/40 dark:bg-accent/25 blur-[60px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[18rem] h-[18rem] rounded-full bg-accent/35 dark:bg-accent/22 blur-[50px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[22rem] h-[22rem] rounded-full bg-accent/30 dark:bg-accent/18 blur-[60px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-accent/28 dark:bg-accent/16 blur-[45px]" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <Link to="/login" className="flex items-center justify-center gap-2 mb-8 group">
          <img
            src="/contapplogo.png"
            alt="ContApp"
            className="h-14 w-auto transition-transform duration-200 group-hover:scale-110"
          />
        </Link>

        <div className="bg-frame border border-border rounded-2xl p-8 shadow-sm">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition"
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
                  <span>Intră în cont</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Accesul se face pe bază de cont creat intern.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} ContApp. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  );
}
