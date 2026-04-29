import { useEffect, useRef, type ReactNode } from "react";

const HEADLINE =
  "Echipele care folosesc ContApp scapă de haosul în Excel, WhatsApp, mailuri și foldere. Clienții, contractele, ticketele, concediile și legislația sunt într-un singur loc — cu status clar, alerte automate și acces controlat.";

const MAX_BLUR_PX = 6;
const BASE_OPACITY = 0.15;

/** Coarse heuristic: skip the blur entirely on low-spec hardware. */
function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 4;
  return cores <= 2 || mem <= 1;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scroll-driven blur reveal, optimised for mid-range hardware.
 *
 * Why it's fast:
 *  - React renders the word spans ONCE. Scroll updates a single CSS custom
 *    property `--p` on the container (via a rAF-throttled scroll handler
 *    that writes directly to `style`) — no React re-renders after mount.
 *  - Each word reads its own progress via CSS `calc()` from `--p` + its
 *    assigned index `--i`, so the browser does all interpolation natively.
 *  - `will-change` is only toggled while the section is intersecting the
 *    viewport (driven by `IntersectionObserver`), so the GPU layer and
 *    the scroll handler are released once the section leaves the screen.
 *  - No CSS transition on `filter`/`opacity` — the scroll itself is the
 *    timeline, and a transition on top would double the paint work.
 *  - Respects `prefers-reduced-motion` and bails out on low-end devices
 *    (<=2 CPU cores or <=1 GB reported RAM) by rendering the text flat.
 */
export function BlurInHeadline(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const words = HEADLINE.split(" ");

  useEffect(() => {
    const container = containerRef.current;
    const paragraph = paragraphRef.current;
    if (!container || !paragraph) return;

    if (prefersReducedMotion() || isLowEndDevice()) {
      paragraph.style.setProperty("--p", "1");
      paragraph.dataset.mode = "static";
      return;
    }

    let visible = false;
    let ticking = false;
    let rafId = 0;

    const update = () => {
      ticking = false;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.9;
      const end = windowHeight * 0.25;
      const progress = Math.min(
        1,
        Math.max(0, (start - rect.top) / (start - end))
      );
      // Write to the DOM once, bypassing React.
      paragraph.style.setProperty("--p", progress.toFixed(3));
    };

    const onScroll = () => {
      if (!visible || ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visible = entry.isIntersecting;
        paragraph.style.willChange = visible ? "filter, opacity" : "auto";
        if (visible) update();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(container);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafId);
      paragraph.style.willChange = "auto";
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="w-full bg-background px-6 py-24"
    >
      <div className="mx-auto max-w-5xl">
        <p
          ref={paragraphRef}
          className="blur-headline text-3xl font-medium text-left leading-snug tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-snug"
          style={
            {
              "--p": "0",
              "--n": String(words.length),
              "--max-blur": `${MAX_BLUR_PX}px`,
              "--base-opacity": String(BASE_OPACITY),
            } as React.CSSProperties
          }
        >
          {words.map((word, index) => (
            <span
              key={index}
              className="blur-headline__word mr-2 inline-block lg:mr-3"
              style={{ "--i": String(index) } as React.CSSProperties}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
