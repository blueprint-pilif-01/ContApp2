import { ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Login(): ReactNode {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState<"creds" | "twofa">("creds");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("twofa");
    }, 600);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20"
        style={{
          background: "radial-gradient(ellipse at center top, var(--accent), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Corner dots */}
      <div className="pointer-events-none absolute inset-4 rounded-3xl border border-foreground/5" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <img src="/contapplogo.png" alt="ContApp" className="h-14 w-auto transition-transform duration-200 group-hover:scale-110" />
        </a>

        {step === "creds" ? (
          <div className="bg-frame border border-border rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Bun venit înapoi.</h1>
            <p className="text-sm text-muted-foreground mt-1.5 mb-7">
              Autentifică-te pentru a accesa ContApp.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
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
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Parolă
                  </label>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    Ai uitat parola?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
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
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPwd ? "Ascunde parola" : "Arată parola"}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 text-background rounded-xl text-sm font-semibold transition-colors mt-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    Intră în cont
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Nu ai cont?{" "}
                <a href="#" className="text-foreground font-medium hover:underline underline-offset-2">
                  Începe gratuit
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-frame border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 mx-auto mb-5">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight text-center">
              Verificare 2FA
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 mb-7 text-center">
              Introdu codul de 6 cifre din aplicația ta de autentificare.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center text-3xl tracking-[0.6em] font-mono px-4 py-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition placeholder:text-muted-foreground/50 placeholder:tracking-[0.4em] placeholder:text-xl"
                autoFocus
              />

              <button
                type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed text-background rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    Verifică codul
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setStep("creds"); setCode(""); }}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
            >
              ← Înapoi la autentificare
            </button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} ContApp. Toate drepturile rezervate.
        </p>
      </div>
    </div>
  );
}
