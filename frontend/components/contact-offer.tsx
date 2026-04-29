import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Mail,
  Phone,
  Send,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  EMPLOYEE_BANDS,
  LANDING_EXTENSIONS,
  type LandingExtensionKey,
} from "@/lib/config";
import {
  PRICING_OFFER_EVENT,
  type PricingOfferDetail,
} from "./pricing";

const ease = [0.23, 1, 0.32, 1] as const;

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; ticketId: string }
  | { status: "error"; message: string };

export function ContactOffer() {
  const [selected, setSelected] = useState<Set<LandingExtensionKey>>(new Set());
  const [bandId, setBandId] = useState<string>(EMPLOYEE_BANDS[0]!.id);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  // Listen for "Solicită ofertă" clicks from the Pricing builder.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<PricingOfferDetail>).detail;
      if (!detail) return;
      setSelected(new Set(detail.selected));
      setBandId(detail.bandId);
    };
    document.addEventListener(PRICING_OFFER_EVENT, handler);
    return () => document.removeEventListener(PRICING_OFFER_EVENT, handler);
  }, []);

  const toggleExt = (key: LandingExtensionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) {
      setSubmit({
        status: "error",
        message: "Numele firmei și adresa de email sunt obligatorii.",
      });
      return;
    }
    setSubmit({ status: "loading" });
    try {
      const res = await fetch("/contact/offer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          employee_band: bandId,
          extensions: Array.from(selected),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as { ticket_id?: string; message?: string };
      setSubmit({
        status: "success",
        ticketId: body.ticket_id ?? "—",
      });
      // Reset form fields (keep selections so the user sees what they sent).
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setSubmit({
        status: "error",
        message:
          err instanceof Error
            ? `Nu am putut trimite cererea (${err.message}). Scrie-ne la hello@contapp.ro.`
            : "Nu am putut trimite cererea. Scrie-ne la hello@contapp.ro.",
      });
    }
  };

  return (
    <section
      id="contact"
      className="w-full bg-background px-6 py-20 sm:py-28 scroll-mt-24"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 max-w-2xl"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Contact · ofertă personalizată
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Spune-ne ce vrei să activezi.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Bifează extensiile dorite, alege banda de angajați și trimite-ne
            datele de contact. Revenim cu o ofertă oficială (preț + setup) în
            cel mult o zi lucrătoare.
          </p>
        </motion.div>

        {submit.status === "success" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-3xl border border-accent/40 bg-accent/10 p-10 text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/30 mb-4">
              <CheckCircle2 className="w-7 h-7 text-foreground" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
              Cererea ta a fost trimisă.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Mulțumim! Echipa ContApp te contactează în maxim o zi lucrătoare
              cu o ofertă personalizată. Numărul tău de referință este{" "}
              <code className="font-mono text-foreground">{submit.ticketId}</code>.
            </p>
            <button
              type="button"
              onClick={() => setSubmit({ status: "idle" })}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
            >
              Trimite altă cerere
            </button>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6"
          >
            {/* Left: contact + extensions selector */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-frame p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Companie"
                    icon={<Building2 className="w-4 h-4" />}
                    required
                    value={companyName}
                    onChange={setCompanyName}
                    placeholder="ex: SC Atlas Trading SRL"
                  />
                  <Field
                    label="Persoană de contact"
                    icon={<User className="w-4 h-4" />}
                    value={contactName}
                    onChange={setContactName}
                    placeholder="Nume + prenume"
                  />
                  <Field
                    label="Email"
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    required
                    value={email}
                    onChange={setEmail}
                    placeholder="contact@firma.ro"
                  />
                  <Field
                    label="Telefon"
                    icon={<Phone className="w-4 h-4" />}
                    value={phone}
                    onChange={setPhone}
                    placeholder="+40 ..."
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Mesaj (opțional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Detalii suplimentare: cazuri specifice, integrări, termen de implementare..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition resize-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-frame p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Extensii dorite
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Pachetul de bază (dashboard, notebook, planner, documente,
                  utilizatori, categorii angajați) este inclus gratuit.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LANDING_EXTENSIONS.map((ext) => {
                    const isSelected = selected.has(ext.key);
                    const available = !ext.comingSoon;
                    return (
                      <button
                        type="button"
                        key={ext.key}
                        onClick={() => available && toggleExt(ext.key)}
                        disabled={!available}
                        className={`text-left rounded-xl border p-3 transition-colors ${
                          isSelected
                            ? "border-accent/50 bg-accent/5"
                            : available
                              ? "border-border bg-background hover:border-foreground/20"
                              : "border-border bg-background opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 inline-flex w-5 h-5 rounded-md border-2 items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-accent border-accent text-black"
                                : "border-border bg-background"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3" strokeWidth={3} />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground flex flex-wrap items-start gap-1.5">
                              <span className="whitespace-pre-line">{ext.label}</span>
                              {ext.comingSoon && (
                                <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-foreground/8 text-muted-foreground">
                                  roadmap
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {ext.tagline}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: employee band + summary */}
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-border bg-frame p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Câți angajați?
                </p>
                <div className="space-y-1.5">
                  {EMPLOYEE_BANDS.map((b) => {
                    const active = bandId === b.id;
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                          active
                            ? "border-foreground bg-foreground/5"
                            : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <input
                          type="radio"
                          name="employee-band"
                          checked={active}
                          onChange={() => setBandId(b.id)}
                          className="accent-foreground"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{b.label}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {b.range}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-frame p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Rezumat
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center justify-between text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent" /> Pachet de bază
                    </span>
                    <span className="text-muted-foreground">gratuit</span>
                  </li>
                  {selected.size === 0 ? (
                    <li className="text-muted-foreground/70 italic">
                      Nicio extensie selectată.
                    </li>
                  ) : (
                    Array.from(selected).map((key) => {
                      const ext = LANDING_EXTENSIONS.find((e) => e.key === key);
                      if (!ext) return null;
                      return (
                        <li
                          key={key}
                          className="flex items-start gap-1.5 text-foreground"
                        >
                          <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                          <span className="whitespace-pre-line">{ext.label}</span>
                        </li>
                      );
                    })
                  )}
                  <li className="pt-2 border-t border-border flex items-center justify-between text-foreground">
                    <span>Banda angajați</span>
                    <span className="font-semibold">
                      {EMPLOYEE_BANDS.find((b) => b.id === bandId)?.label}
                    </span>
                  </li>
                </ul>
              </div>

              {submit.status === "error" && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-3 text-xs text-red-600 dark:text-red-400">
                  {submit.message}
                </div>
              )}

              <button
                type="submit"
                disabled={submit.status === "loading"}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60 transition-colors"
              >
                {submit.status === "loading" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Trimite cererea
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Răspundem în maxim 1 zi lucrătoare. Datele tale nu sunt
                partajate cu terți.
              </p>
            </aside>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  icon,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/15 transition"
        />
      </div>
    </div>
  );
}
