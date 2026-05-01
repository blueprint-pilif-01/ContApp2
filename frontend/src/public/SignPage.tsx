import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  PenTool,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SignatureCanvas } from "../components/SignatureCanvas";
import { api, isApiError } from "../lib/api";

type FieldType = "text" | "date" | "number" | "signature" | "signature_accountant";

interface FieldAttrs {
  id: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
}

interface SignPayload {
  invite: {
    id: number;
    public_token: string;
    status: string;
    expiration_date: string | null;
    remarks: string;
  };
  template: { id: number; name: string; contract_type: string } | null;
  content: TiptapDoc | null;
  client_hint: { first_name?: string; last_name?: string; email?: string } | null;
}

interface TiptapDoc {
  type: string;
  content?: TiptapNode[];
}
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  content?: TiptapNode[];
}

function extractFields(doc: TiptapDoc | null): FieldAttrs[] {
  if (!doc) return [];
  const out: FieldAttrs[] = [];
  const seen = new Set<string>();
  const walk = (node: TiptapNode) => {
    if (node.type === "fieldNode" && node.attrs) {
      const attrs = node.attrs as unknown as FieldAttrs;
      const key = attrs.id || `${attrs.label}-${attrs.fieldType}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ ...attrs, id: key });
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  if (Array.isArray(doc.content)) doc.content.forEach(walk);
  return out;
}

function renderPreview(doc: TiptapDoc | null, filled: Record<string, string>): string {
  if (!doc) return "";
  const parts: string[] = [];
  const walk = (node: TiptapNode) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    if (node.type === "fieldNode" && node.attrs) {
      const a = node.attrs as unknown as FieldAttrs;
      const v = filled[a.id];
      if (a.fieldType === "signature" || a.fieldType === "signature_accountant") {
        parts.push(v ? "[✍ semnat]" : `[${a.label}]`);
      } else {
        parts.push(v?.trim() ? v : `____${a.label}____`);
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
    if (node.type === "paragraph") parts.push("\n\n");
  };
  if (Array.isArray(doc.content)) doc.content.forEach(walk);
  return parts.join("").trim();
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SignPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accept, setAccept] = useState(false);
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<SignPayload>(`/public/sign/${token}`, { skipAuth: true })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Pre-fill from client hint where field labels match (best-effort UX).
        const hint = res.client_hint;
        if (hint) {
          const seed: Record<string, string> = {};
          const fields = extractFields(res.content);
          for (const f of fields) {
            const lbl = f.label.toLowerCase();
            if (lbl.includes("nume") && hint.first_name && hint.last_name) {
              seed[f.id] = `${hint.first_name} ${hint.last_name}`;
            } else if (lbl.includes("email") && hint.email) {
              seed[f.id] = hint.email;
            }
          }
          if (Object.keys(seed).length > 0) setFilled(seed);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(isApiError(e) ? e.message : "Linkul nu a putut fi încărcat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const fields = useMemo(() => extractFields(data?.content ?? null), [data]);
  const dataFields = fields.filter(
    (f) => f.fieldType !== "signature" && f.fieldType !== "signature_accountant"
  );
  const requiresSignature = fields.some(
    (f) => f.fieldType === "signature" || f.fieldType === "signature_accountant"
  );

  const missing = dataFields.filter((f) => f.required && !filled[f.id]?.trim());
  const canSubmit =
    accept && missing.length === 0 && (!requiresSignature || !!signatureDataUrl);

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api.post<{
        message: string;
        submission_id: number;
        contract_number: string;
      }>(
        `/public/sign/${token}`,
        {
          filled_fields: filled,
          signature_image: signatureDataUrl,
          accepted_at: new Date().toISOString(),
        },
        { skipAuth: true }
      );
      navigate(`/public/sign/${token}/success`, {
        state: {
          contract_number: res.contract_number,
          template_name: data?.template?.name,
        },
        replace: true,
      });
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Trimiterea a eșuat. Încearcă din nou."
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PublicShell token={token}>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Se încarcă contractul…</p>
        </div>
      </PublicShell>
    );
  }

  if (error && !data) {
    return (
      <PublicShell token={token}>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold">Link invalid</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell token={token} title={data?.template?.name}>
      <div className="space-y-5">
        {/* Contract preview */}
        <section className="rounded-2xl border border-border bg-background p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Previzualizare contract
          </h3>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans max-h-[260px] overflow-y-auto">
            {renderPreview(data?.content ?? null, filled)}
          </pre>
        </section>

        {/* Dynamic form */}
        {dataFields.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completează datele
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dataFields.map((f) => (
                <Input
                  key={f.id}
                  label={
                    f.required ? `${f.label} *` : `${f.label} (opțional)`
                  }
                  type={
                    f.fieldType === "date"
                      ? "date"
                      : f.fieldType === "number"
                        ? "number"
                        : "text"
                  }
                  value={filled[f.id] ?? ""}
                  onChange={(e) =>
                    setFilled((p) => ({ ...p, [f.id]: e.target.value }))
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Signature */}
        {requiresSignature && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" /> Semnătura ta
            </h3>
            <SignatureCanvas onChange={setSignatureDataUrl} />
            {signatureDataUrl && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Semnătură capturată
              </p>
            )}
          </section>
        )}

        {/* Accept */}
        <label className="flex items-start gap-2 text-xs text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5"
          />
          Confirm că am citit și sunt de acord cu termenii contractului. Datele
          mele sunt transmise doar cabinetului care a inițiat solicitarea.
        </label>

        {error && (
          <p className="text-xs text-red-500 inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Renunță
          </Button>
          <Button
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
          >
            <CheckCircle2 className="w-4 h-4" /> Semnează contract
          </Button>
        </div>

        {!canSubmit && !submitting && (
          <p className="text-[11px] text-muted-foreground text-right">
            {missing.length > 0
              ? `Completează: ${missing.map((m) => m.label).join(", ")}`
              : !signatureDataUrl && requiresSignature
                ? "Adaugă semnătura."
                : !accept
                  ? "Bifează acordul."
                  : ""}
          </p>
        )}
      </div>
    </PublicShell>
  );
}

function PublicShell({
  children,
  token,
  title,
}: {
  children: React.ReactNode;
  token?: string | undefined;
  title?: string | undefined;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--ai-grad-1)_30%,transparent)_0%,transparent_60%),radial-gradient(circle_at_80%_90%,color-mix(in_oklab,var(--ai-grad-3)_28%,transparent)_0%,transparent_55%)]" />

      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-3xl border border-border bg-frame overflow-hidden shadow-xl">
        <aside className="bg-foreground/5 p-6 flex flex-col gap-3 border-r border-border">
          <div className="flex items-center gap-2">
            <img src="/contapplogo.png" alt="ContApp" className="h-8 w-auto" />
            <span className="text-sm font-semibold">ContApp</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight mt-2">
            Semnare contract
          </h2>
          {title && (
            <p className="text-sm text-foreground/80 font-medium">{title}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Document trimis printr-un link public securizat. Datele se trimit
            doar cabinetului care a inițiat solicitarea.
          </p>
          <div className="mt-auto space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Conexiune criptată
            </p>
            {token && (
              <p className="flex items-center gap-1.5 break-all">
                <FileText className="w-3.5 h-3.5 shrink-0" /> Token: <code>{token}</code>
              </p>
            )}
          </div>
        </aside>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
