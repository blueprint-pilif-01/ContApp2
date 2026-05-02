import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Lock,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import {
  BASE_PACKAGE_FEATURES,
  EMPLOYEE_BANDS,
  LANDING_EXTENSIONS,
  type EmployeeBand,
  type LandingExtension,
  type LandingExtensionKey,
} from "@/lib/config";
import { ConnectedDots } from "./connected-dots";

const ease = [0.23, 1, 0.32, 1] as const;

function formatPrice(price: number): string {
  if (price === 0) return "Gratuit";
  return `${price.toFixed(0)} €`;
}

function calculateExtensionPrice(
  ext: LandingExtension,
  band: EmployeeBand
): number {
  if (band.custom) return 0;
  return Math.round(ext.basePriceEur * band.multiplier);
}

interface PricingBuilderState {
  selected: Set<LandingExtensionKey>;
  bandId: string;
}

/**
 * Public broadcast bus so the Contact section can pre-fill itself when the
 * user clicks "Solicită ofertă" on the pricing builder.
 */
export const PRICING_OFFER_EVENT = "contapp:pricing-offer-request";

export interface PricingOfferDetail {
  selected: LandingExtensionKey[];
  bandId: string;
}

export function Pricing() {
  const [state, setState] = useState<PricingBuilderState>({
    selected: new Set<LandingExtensionKey>(),
    bandId: EMPLOYEE_BANDS[0]!.id,
  });

  const band = useMemo(
    () => EMPLOYEE_BANDS.find((b) => b.id === state.bandId) ?? EMPLOYEE_BANDS[0]!,
    [state.bandId]
  );

  const extensionTotal = useMemo(() => {
    if (band.custom) return 0;
    let total = 0;
    for (const ext of LANDING_EXTENSIONS) {
      if (state.selected.has(ext.key)) {
        total += calculateExtensionPrice(ext, band);
      }
    }
    return total;
  }, [state.selected, band]);

  const grandTotal = band.custom ? 0 : extensionTotal + band.baseFeeEur;

  const toggleExtension = (key: LandingExtensionKey, available: boolean) => {
    if (!available) return;
    setState((prev) => {
      const next = new Set(prev.selected);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, selected: next };
    });
  };

  const handleRequestOffer = () => {
    const detail: PricingOfferDetail = {
      selected: Array.from(state.selected),
      bandId: state.bandId,
    };
    document.dispatchEvent(
      new CustomEvent(PRICING_OFFER_EVENT, { detail })
    );
    document.getElementById("contact")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      id="pricing"
      className="relative w-full bg-background px-6 py-20 sm:py-28 scroll-mt-24 overflow-hidden"
    >
      {/* Ambient network — full-bleed background layer */}
      <div
        className="pointer-events-none absolute inset-0 text-accent/12 dark:text-accent/16 max-[850px]:hidden"
        aria-hidden="true"
      >
        <ConnectedDots variant="weave" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-10 sm:mb-12 max-w-3xl"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Configurează pachetul tău
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Plătești doar ce folosești.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Pachetul de bază este gratuit. Adaugă doar extensiile de care ai
            nevoie și plătește în funcție de numărul de angajați. Fără pachete
            fixe, fără funcții pentru care nu plătești.
          </p>
        </motion.div>

        {/* ── Free base package ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mb-6 rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-foreground inline-flex items-center gap-2">
                  <Check className="w-5 h-5 text-accent" /> Pachet de bază
                </h3>
                <span className="text-sm font-semibold text-accent">
                  GRATUIT
                </span>
                <span className="text-xs text-muted-foreground">
                  · pentru 1–10 angajați
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
                Tot ce ai nevoie ca să pornești. Inclus în orice configurație,
                indiferent de extensiile pe care le activezi.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-1.5">
                {BASE_PACKAGE_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <Check
                      className="w-4 h-4 text-accent mt-0.5 shrink-0"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ── Builder: extensii în 2 coloane + rezumat lateral (desktop) ─ */}
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[1fr_340px] xl:items-start">
          {/* Extension cards — 2 pe rând de la md în sus */}
          <div>
            <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 mb-4">
              <h3 className="text-base font-semibold text-foreground">
                Adaugă extensiile dorite
              </h3>
              <span className="text-xs text-muted-foreground">
                Click pentru a activa / dezactiva
              </span>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LANDING_EXTENSIONS.map((ext, i) => {
                const isSelected = state.selected.has(ext.key);
                const available = !ext.comingSoon;
                const price = calculateExtensionPrice(ext, band);
                return (
                  <motion.button
                    key={ext.key}
                    type="button"
                    onClick={() => toggleExtension(ext.key, available)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, ease, delay: i * 0.03 }}
                    disabled={!available}
                    className={`group h-full min-h-0 text-left rounded-2xl border p-4 sm:p-5 transition-all flex flex-col ${
                      isSelected
                        ? "border-accent/50 bg-accent/5 shadow-sm"
                        : available
                          ? "border-border bg-frame hover:border-foreground/20"
                          : "border-border bg-frame opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-h-0">
                      <span
                        className={`mt-0.5 inline-flex w-6 h-6 rounded-md border-2 items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-accent border-accent text-accent-contrast"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : ext.comingSoon ? (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </span>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm sm:text-base font-semibold text-foreground whitespace-pre-line inline-flex flex-wrap items-center gap-2 pr-1">
                            {ext.label}
                            {ext.comingSoon && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-foreground/8 text-muted-foreground">
                                roadmap
                              </span>
                            )}
                          </h4>
                          <div className="text-right shrink-0">
                            {ext.comingSoon ? (
                              <span className="text-sm font-semibold text-muted-foreground">
                                —
                              </span>
                            ) : band.custom ? (
                              <span className="text-sm font-semibold text-foreground">
                                custom
                              </span>
                            ) : (
                              <>
                                <span className="text-base font-semibold text-foreground">
                                  {price} €
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {" "}
                                  / lună
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/70">{ext.tagline}</p>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">
                          {ext.description}
                        </p>
                        <ul className="mt-3 grid grid-cols-1 gap-y-1 flex-1">
                          {ext.highlights.map((h) => (
                            <li
                              key={h}
                              className="flex items-start gap-1.5 text-xs text-foreground/65"
                            >
                              <Check className="w-3 h-3 text-accent mt-0.5 shrink-0" strokeWidth={2.5} />
                              <span className="line-clamp-2">{h}</span>
                            </li>
                          ))}
                        </ul>
                        {ext.audience.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {ext.audience.map((a) => (
                              <span
                                key={a}
                                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                        {ext.hint && (
                          <p className="mt-2 text-[11px] text-muted-foreground/80 italic line-clamp-2">
                            {ext.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Sticky summary sidebar */}
          <aside className="xl:sticky xl:top-24 shrink-0">
            <div className="rounded-3xl border border-border bg-frame overflow-hidden">
              {/* Employee band picker */}
              <div className="p-5 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Câți angajați?
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {EMPLOYEE_BANDS.map((b) => {
                    const active = state.bandId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({ ...prev, bandId: b.id }))
                        }
                        className={`text-left rounded-xl border px-3 py-2 transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:border-foreground/30"
                        }`}
                      >
                        <p className="text-sm font-semibold">{b.label}</p>
                        <p
                          className={`text-[11px] ${
                            active ? "text-background/70" : "text-muted-foreground"
                          }`}
                        >
                          {b.range}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {band.baseFeeEur > 0 && !band.custom && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Banda {band.label}: + {band.baseFeeEur} € / lună (capacitate
                    suplimentară)
                  </p>
                )}
              </div>

              {/* Selected extensions list */}
              <div className="p-5 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Configurația ta
                </p>
                <div className="rounded-xl bg-background border border-border p-3">
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mb-2">
                    <Check className="w-3 h-3 text-accent" /> Pachet de bază
                    (gratuit)
                  </p>
                  {state.selected.size === 0 ? (
                    <p className="text-xs text-muted-foreground/70 italic">
                      Nicio extensie selectată — vei plăti 0 € pentru pachetul
                      de bază.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {LANDING_EXTENSIONS.filter((e) =>
                        state.selected.has(e.key)
                      ).map((ext) => (
                        <li
                          key={ext.key}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-foreground inline-flex items-center gap-1.5 truncate">
                            <Sparkles className="w-3 h-3 text-accent shrink-0" />
                            {ext.label.replace(/\r?\n/g, " ")}
                          </span>
                          {!band.custom && (
                            <span className="text-foreground/70 font-medium shrink-0">
                              {calculateExtensionPrice(ext, band)} €
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Total + CTA */}
              <div className="p-5 space-y-4">
                {band.custom ? (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                    <p className="text-sm font-semibold text-foreground">
                      Pentru 51+ angajați
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Configurăm o ofertă personalizată cu volum și SLA dedicat.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Total estimativ
                      </span>
                      <div>
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          {formatPrice(grandTotal)}
                        </span>
                        {grandTotal > 0 && (
                          <span className="text-sm text-muted-foreground ml-1">
                            / lună
                          </span>
                        )}
                      </div>
                    </div>
                    {extensionTotal > 0 && band.baseFeeEur > 0 && (
                      <div className="text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border">
                        <div className="flex justify-between">
                          <span>Extensii ({state.selected.size})</span>
                          <span>{extensionTotal} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Banda angajați {band.label}</span>
                          <span>+ {band.baseFeeEur} €</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={handleRequestOffer}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
                >
                  Solicită ofertă personalizată
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Te contactăm în 1 zi lucrătoare cu o ofertă oficială. Fără
                  obligație de cumpărare.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          Plățile sunt procesate prin Stripe. Activezi sau dezactivezi extensii
          oricând din panoul de admin al organizației.
        </motion.p>
      </div>
    </section>
  );
}
