import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  PenTool,
  Phone,
  Shield,
  Upload,
  User,
  Users,
} from "lucide-react";
import { logout, usePrincipal } from "../../../hooks/useMe";
import { useUpdateTeamUser } from "../../../hooks/useTeamUsers";
import { useExtensions } from "../../../hooks/useExtensions";
import { useSubscription } from "../../../hooks/useSubscription";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SignatureCanvas } from "../../../components/SignatureCanvas";
import { useToast } from "../../../components/ui/Toast";
import { isApiError } from "../../../lib/api";
import { getSession, setSession } from "../../../lib/session";
import { canManageWorkspaceSettings } from "../../../lib/access";
import {
  EXTENSIONS,
  EXTENSION_KEYS,
  extensionLabelOneLine,
  type ExtensionKey,
} from "../../../lib/extensions";
import { cn } from "../../../lib/utils";

type SectionId = "profile" | "security" | "subscription" | "signature" | "team";

const SECTIONS: { id: SectionId; label: string; icon: typeof User; description: string }[] = [
  { id: "profile", label: "Profil", icon: User, description: "Date personale și contact" },
  { id: "security", label: "Securitate", icon: Shield, description: "Parolă și autentificare" },
  { id: "subscription", label: "Abonament", icon: CreditCard, description: "Plan curent și utilizare" },
  { id: "signature", label: "Semnătură", icon: PenTool, description: "Semnătura ta digitală" },
  { id: "team", label: "Users & Roles", icon: Users, description: "Gestionează echipa" },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const principal = usePrincipal("user");
  const canManageSettings = canManageWorkspaceSettings(principal);
  const tabParam = searchParams.get("tab");
  const initial: SectionId =
    tabParam === "subscription" || tabParam === "security" ||
    tabParam === "signature" || tabParam === "team" || tabParam === "profile"
      ? (tabParam as SectionId)
      : "profile";
  const [active, setActive] = useState<SectionId>(initial);
  const navigate = useNavigate();
  const visibleSections = canManageSettings
    ? SECTIONS
    : SECTIONS.filter((section) =>
        ["profile", "security", "signature"].includes(section.id)
      );

  useEffect(() => {
    if (!visibleSections.some((section) => section.id === active)) {
      setActive("profile");
    }
  }, [active, visibleSections]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (active === "profile") next.delete("tab");
    else next.set("tab", active);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setări"
        description={
          canManageSettings
            ? "Cont, securitate, abonament, semnătură și echipă."
            : "Cont, securitate și semnătura ta digitală."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-frame overflow-hidden">
          <ul>
            {visibleSections.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id === "team") {
                        navigate("/app/settings/users-roles");
                        return;
                      }
                      setActive(s.id);
                    }}
                    className={cn(
                      "w-full text-left p-3 flex items-center gap-3 transition-colors",
                      isActive ? "bg-foreground/8" : "hover:bg-foreground/5"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isActive
                          ? "bg-[color:var(--accent)]/20 text-foreground"
                          : "bg-foreground/8 text-foreground/70"
                      )}
                    >
                      <s.icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section>
          {active === "profile" && <ProfileSection canManageWorkspace={canManageSettings} />}
          {active === "security" && <SecuritySection />}
          {active === "subscription" && canManageSettings && <SubscriptionSection />}
          {active === "signature" && <SignatureSection />}
        </section>
      </div>
    </div>
  );
}

/* ───────── Profile ───────── */

function ProfileSection({ canManageWorkspace }: { canManageWorkspace: boolean }) {
  const toast = useToast();
  const principal = usePrincipal();
  const navigate = useNavigate();
  const isUser = principal?.kind === "user";
  const userId = isUser ? (principal.membership_id ?? 0) : 0;
  const update = useUpdateTeamUser(userId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  useEffect(() => {
    if (!principal) return;
    setFirstName(principal.first_name);
    setLastName(principal.last_name);
    setEmail(principal.email);
    setPhone(principal.kind === "user" ? principal.phone : "");
  }, [principal]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUser) {
      toast.info("Editarea profilului nu este disponibilă în acest cont.");
      return;
    }
    if (!canManageWorkspace) {
      toast.info("Datele de profil sunt gestionate de owner sau HR.");
      return;
    }
    if (!userId) {
      toast.error("Profilul nu poate fi salvat fără un workspace activ.");
      return;
    }
    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    const nextEmail = email.trim();
    const nextPhone = phone.trim();
    const nextName = `${nextFirstName} ${nextLastName}`.trim() || nextEmail;
    update.mutate(
      {
        organisation_id: principal.organisation_id ?? 0,
        type: principal.type,
        first_name: nextFirstName,
        last_name: nextLastName,
        email: nextEmail,
        phone: nextPhone,
        password: "",
        status: principal.status,
      },
      {
        onSuccess: () => {
          const session = getSession("user");
          if (session?.principal.kind === "user") {
            setSession(
              {
                ...session,
                principal: {
                  ...session.principal,
                  first_name: nextFirstName,
                  last_name: nextLastName,
                  email: nextEmail,
                  phone: nextPhone,
                },
              },
              "user"
            );
          }
          toast.success("Profil actualizat.");
        },
        onError: (e) => toast.error(isApiError(e) ? e.message : "Eroare la salvare."),
      }
    );
  };

  const fullName = `${firstName} ${lastName}`.trim() || email || "—";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-frame p-5 flex items-center gap-4">
        <Avatar name={fullName} size="lg" status="online" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">{fullName}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge variant="accent" className="mt-1.5">
            {principal?.role ?? "—"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="w-4 h-4" /> Ieșire cont
        </Button>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-border bg-frame p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold tracking-tight">Date personale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Prenume"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={!canManageWorkspace}
          />
          <Input
            label="Nume"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={!canManageWorkspace}
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leadingIcon={<Mail className="w-4 h-4" />}
          disabled={!canManageWorkspace}
        />
        <Input
          label="Telefon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          leadingIcon={<Phone className="w-4 h-4" />}
          disabled={!canManageWorkspace}
        />
        <div className="pt-2 flex justify-end">
          <Button type="submit" loading={update.isPending} size="sm" disabled={!canManageWorkspace}>
            <Check className="w-4 h-4" /> Salvează
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-frame p-5 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight inline-flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notificări
        </h2>
        <Toggle
          label="Notificări email"
          description="Primești update-uri pe email pentru tickete și contracte."
          value={emailNotifs}
          onChange={setEmailNotifs}
        />
        <Toggle
          label="Notificări push (browser)"
          description="Alerte în timp real în browser când e nevoie de atenția ta."
          value={pushNotifs}
          onChange={setPushNotifs}
        />
      </div>
    </div>
  );
}

/* ───────── Security ───────── */

function SecuritySection() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (next.length < 6) {
            toast.error("Parola nouă trebuie să aibă minim 6 caractere.");
            return;
          }
          if (next !== confirmPwd) {
            toast.error("Parolele nu coincid.");
            return;
          }
          toast.success("Parola actualizată.");
          setCurrent("");
          setNext("");
          setConfirmPwd("");
        }}
        className="rounded-2xl border border-border bg-frame p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold tracking-tight inline-flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Schimbă parola
        </h2>
        <Input
          label="Parolă curentă"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Parolă nouă"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Input
            label="Confirmă parolă"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
        </div>
        <div className="pt-2 flex justify-end">
          <Button type="submit" size="sm">
            Actualizează parola
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-frame p-5 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight inline-flex items-center gap-2">
          <Shield className="w-4 h-4" /> Autentificare în 2 pași
        </h2>
        <p className="text-sm text-muted-foreground">
          Adaugă un nivel suplimentar de securitate. Activarea este disponibilă în
          curând.
        </p>
        <Button variant="outline" size="sm" disabled>
          Activează 2FA
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-frame p-5">
        <h2 className="text-sm font-semibold tracking-tight">Sesiuni active</h2>
        <ul className="mt-3 space-y-2">
          {[
            { device: "Chrome · Windows", location: "București", current: true },
            { device: "Safari · iPhone", location: "Cluj-Napoca", current: false },
          ].map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border border-border"
            >
              <div>
                <p className="text-sm font-medium">{s.device}</p>
                <p className="text-xs text-muted-foreground">{s.location}</p>
              </div>
              {s.current ? (
                <Badge variant="success">Sesiunea curentă</Badge>
              ) : (
                <Button size="xs" variant="ghost" className="text-red-500">
                  Deconectează
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────── Subscription ───────── */

function SubscriptionSection() {
  const { data: sub } = useSubscription();
  const ext = useExtensions();
  const toast = useToast();

  const plan = sub?.plan ?? "—";
  const periodEnd = sub?.periodEnd ? new Date(sub.periodEnd) : null;

  const usageRows = sub
    ? [
        { label: "Șabloane", used: sub.usage.templates, limit: sub.limits.templates },
        { label: "Semnări (luna)", used: sub.usage.signings_this_month, limit: sub.limits.signings_per_month },
        { label: "Clienți", used: sub.usage.clients, limit: sub.limits.clients },
        { label: "Stocare", used: sub.usage.storage_mb, limit: sub.limits.storage_mb, unit: "MB" },
      ]
    : [];

  const handleToggle = async (key: ExtensionKey, next: boolean) => {
    if (!ext.canToggleSelfService) {
      toast.info("Extensiile se activează din Admin Platform sau prin abonament.");
      return;
    }
    try {
      await ext.toggle(key, next);
      toast.success(
        next
          ? `${extensionLabelOneLine(key)} a fost activat.`
          : `${extensionLabelOneLine(key)} a fost dezactivat.`
      );
    } catch (e) {
      toast.error(isApiError(e) ? e.message : "Nu s-a putut actualiza extensia.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-frame p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Plan curent</p>
          <h2 className="text-2xl font-semibold mt-1">{plan}</h2>
          {periodEnd && (
            <p className="text-sm text-muted-foreground mt-1">
              Reînnoire pe {periodEnd.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm">
          <ArrowRight className="w-4 h-4" /> Schimbă plan
        </Button>
      </div>

      {usageRows.length > 0 && (
        <div className="rounded-2xl border border-border bg-frame p-5">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Utilizare luna curentă</h2>
          <div className="space-y-4">
            {usageRows.map((u) => {
              const isUnlimited = u.limit === null;
              const pct = isUnlimited ? 0 : Math.min((u.used / (u.limit as number)) * 100, 100);
              return (
                <div key={u.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{u.label}</span>
                    <span className="text-muted-foreground">
                      {u.used}
                      {u.unit ? ` ${u.unit}` : ""} / {isUnlimited ? "∞" : `${u.limit}${u.unit ? ` ${u.unit}` : ""}`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                    {!isUnlimited && (
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-[color:var(--accent)]"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-frame p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Extensii plătite</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Statusul extensiilor active pentru workspace. Activarea este
              administrată din Admin Platform sau prin abonament.
            </p>
          </div>
          <Badge variant="warning" className="shrink-0 inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> admin
          </Badge>
        </div>
        <div className="space-y-2">
          {EXTENSION_KEYS.map((key) => {
            const meta = EXTENSIONS[key];
            const Icon = meta.icon;
            const enabled = ext.canUse(key);
            const disabled =
              !meta.available ||
              ext.isToggling ||
              !ext.isReady ||
              !ext.canToggleSelfService;
            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-xl border border-border"
              >
                <span className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="text-sm font-semibold whitespace-pre-line">
                      {meta.label}
                    </span>
                    {!meta.available && (
                      <Badge variant="neutral" className="text-[10px] shrink-0">
                        roadmap
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                  {meta.tierHint && (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {meta.tierHint}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => !disabled && handleToggle(key, !enabled)}
                  disabled={disabled}
                  aria-label={`Comută ${extensionLabelOneLine(key)}`}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative shrink-0 mt-1",
                    enabled ? "bg-[color:var(--accent)]" : "bg-foreground/15",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                      enabled && "translate-x-5"
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── Signature ───────── */

function SignatureSection() {
  const toast = useToast();
  const principal = usePrincipal();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [sigName, setSigName] = useState("Semnătura mea");
  const [saving, setSaving] = useState(false);

  const saveSignature = () => {
    if (!sigName.trim()) {
      toast.error("Dă un nume semnăturii.");
      return;
    }
    if (!pending) {
      toast.error("Adaugă o semnătură înainte de salvare.");
      return;
    }
    setSaving(true);
    try {
      const ownerId =
        principal?.kind === "user"
          ? (principal.membership_id ?? principal.id)
          : 0;
      localStorage.setItem(
        "contapp_local_signature",
        JSON.stringify({
          name: sigName.trim(),
          owner_id: ownerId,
          image: pending,
          updated_at: new Date().toISOString(),
        })
      );
      toast.success("Semnătură pregătită local.");
      setDrawMode(false);
      setPending(null);
    } catch {
      toast.error("Semnătura nu a putut fi salvată în browser.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPending(ev.target?.result as string);
      setDrawMode(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-frame p-5">
        <h2 className="text-sm font-semibold tracking-tight mb-3">Previzualizare semnătură</h2>
        <div className="rounded-xl border border-border bg-background min-h-[140px] flex items-center justify-center p-4">
          {pending ? (
            <img src={pending} alt="Semnătură" className="max-h-32 object-contain" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nicio semnătură pregătită. Desenează sau încarcă una mai jos.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-frame p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-tight">
          Desenează sau încarcă semnătura
        </h2>
        <Input
          label="Nume semnătură"
          value={sigName}
          onChange={(e) => setSigName(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={drawMode ? "primary" : "outline"}
            size="sm"
            onClick={() => setDrawMode((v) => !v)}
          >
            <PenTool className="w-4 h-4" />
            {drawMode ? "Închide panou" : "Desenează"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-4 h-4" /> Încarcă imagine
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {drawMode && <SignatureCanvas onChange={setPending} />}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDrawMode(false);
              setPending(null);
            }}
          >
            Resetează
          </Button>
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!pending}
            loading={saving}
          >
            Salvează semnătura
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Toggle ───────── */

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-foreground/3 transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <span
        className={cn(
          "w-9 h-5 rounded-full transition-colors relative shrink-0",
          value ? "bg-[color:var(--accent)]" : "bg-foreground/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
            value && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}
