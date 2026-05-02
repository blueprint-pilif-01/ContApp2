import { motion } from "motion/react";
import { useId, type CSSProperties, type ReactNode } from "react";

/**
 * Ambient background network — large, subtle, drawn in on view.
 *
 * Designed to feel like part of the canvas, not a sticker. Use full-bleed
 * absolute positioning across a section, give it a low-opacity tint colour
 * (e.g. `text-accent/12`), and let the entrance animation do the rest.
 *
 * Each preset spans an unscaled viewBox; consumer controls the rendered size
 * via wrapper width/height. Lines and nodes draw in once when the wrapper
 * scrolls into view. After entrance, a few lines softly breathe at random —
 * subtle, never a marching pulse.
 *
 * Lines are masked behind the node circles so connections never appear to
 * pass through a node — they always terminate cleanly at the rim.
 */

type Node = { x: number; y: number; r?: number };
type Edge = [number, number];

interface NetworkPreset {
  width: number;
  height: number;
  nodes: Node[];
  edges: Edge[];
}

/**
 * AMBIENT — sprawling, dense corner clusters with quiet middle. The default
 * full-bleed background; reads as an organic mesh rather than a grid.
 */
const AMBIENT: NetworkPreset = {
  width: 1200,
  height: 700,
  nodes: [
    // Top-left dense cluster
    { x: 80,   y: 110, r: 10 },
    { x: 180,  y: 70,  r: 7  },
    { x: 240,  y: 170, r: 11 },
    { x: 130,  y: 220, r: 8  },
    { x: 320,  y: 90,  r: 9  },
    // Sparse top-mid bridge
    { x: 510,  y: 230, r: 7  },
    { x: 670,  y: 130, r: 8  },
    // Top-right cluster
    { x: 870,  y: 90,  r: 10 },
    { x: 1010, y: 170, r: 9  },
    { x: 1110, y: 80,  r: 8  },
    { x: 940,  y: 240, r: 11 },
    // Center-left cluster
    { x: 200,  y: 400, r: 11 },
    { x: 340,  y: 370, r: 8  },
    { x: 100,  y: 480, r: 9  },
    { x: 260,  y: 510, r: 10 },
    // Sparse middle
    { x: 560,  y: 450, r: 7  },
    { x: 810,  y: 380, r: 10 },
    { x: 970,  y: 430, r: 9  },
    // Bottom-left
    { x: 110,  y: 610, r: 8  },
    { x: 260,  y: 650, r: 10 },
    // Bottom mid
    { x: 530,  y: 620, r: 9  },
    // Bottom-right cluster
    { x: 810,  y: 590, r: 8  },
    { x: 960,  y: 660, r: 11 },
    { x: 1100, y: 580, r: 9  },
    { x: 1140, y: 650, r: 7  },
  ],
  edges: [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 4], [2, 3], [2, 4],
    [4, 5], [5, 6],
    [6, 7], [7, 8], [7, 9], [8, 9], [8, 10], [9, 10],
    [5, 10],
    [3, 11], [11, 12], [11, 13], [11, 14], [12, 14], [13, 14],
    [12, 15], [15, 16],
    [10, 16], [16, 17],
    [14, 18], [18, 19], [19, 20],
    [20, 21], [21, 22], [22, 23], [22, 24], [23, 24], [21, 23],
    [17, 21], [15, 20],
  ],
};

/**
 * DRIFT — three loose horizontal "currents" of dots, wide and short. Reads
 * as a stream of activity; designed for footer panels.
 */
const DRIFT: NetworkPreset = {
  width: 1400,
  height: 480,
  nodes: [
    // Top current
    { x: 60,   y: 90,  r: 8  },
    { x: 200,  y: 130, r: 10 },
    { x: 340,  y: 70,  r: 8  },
    { x: 480,  y: 140, r: 9  },
    { x: 620,  y: 90,  r: 11 },
    { x: 760,  y: 160, r: 8  },
    { x: 900,  y: 80,  r: 9  },
    { x: 1040, y: 150, r: 10 },
    { x: 1180, y: 90,  r: 8  },
    { x: 1320, y: 160, r: 9  },
    // Middle current (sparser)
    { x: 100,  y: 250, r: 9  },
    { x: 380,  y: 290, r: 10 },
    { x: 660,  y: 240, r: 8  },
    { x: 940,  y: 290, r: 9  },
    { x: 1220, y: 240, r: 10 },
    // Bottom current
    { x: 60,   y: 410, r: 8  },
    { x: 280,  y: 380, r: 10 },
    { x: 540,  y: 420, r: 9  },
    { x: 800,  y: 400, r: 11 },
    { x: 1080, y: 420, r: 8  },
    { x: 1340, y: 380, r: 9  },
  ],
  edges: [
    // top current
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
    // middle current
    [10, 11], [11, 12], [12, 13], [13, 14],
    // bottom current
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 20],
    // sparse vertical bridges
    [0, 10], [2, 10], [4, 12], [6, 13], [8, 14],
    [11, 16], [12, 17], [13, 18], [14, 19],
    [10, 15], [11, 17], [13, 19], [9, 20],
  ],
};

/**
 * GROVE — sparse and quiet, isolated little clumps separated by big empty
 * spaces. Designed for editorial / step sections that already carry text.
 */
const GROVE: NetworkPreset = {
  width: 1200,
  height: 700,
  nodes: [
    // Top-center triad
    { x: 480,  y: 90,  r: 9  },
    { x: 580,  y: 60,  r: 8  },
    { x: 660,  y: 130, r: 11 },
    { x: 540,  y: 180, r: 8  },
    // Far-left isolated pair
    { x: 80,   y: 240, r: 10 },
    { x: 160,  y: 320, r: 8  },
    // Right-side trio
    { x: 1020, y: 120, r: 9  },
    { x: 1130, y: 220, r: 8  },
    { x: 980,  y: 290, r: 10 },
    // Center solo
    { x: 700,  y: 340, r: 8  },
    // Mid-left small group
    { x: 240,  y: 480, r: 11 },
    { x: 380,  y: 440, r: 9  },
    { x: 460,  y: 540, r: 8  },
    // Mid-right scatter
    { x: 850,  y: 480, r: 9  },
    { x: 970,  y: 540, r: 11 },
    { x: 1100, y: 480, r: 8  },
    // Bottom-left isolated
    { x: 100,  y: 600, r: 9  },
    // Bottom-center loner
    { x: 600,  y: 640, r: 10 },
    // Bottom-right pair
    { x: 1050, y: 640, r: 8  },
    { x: 1180, y: 600, r: 9  },
  ],
  edges: [
    [0, 1], [0, 2], [1, 2], [0, 3], [2, 3],
    [4, 5],
    [6, 7], [6, 8], [7, 8],
    [3, 9], [9, 13], [8, 9],
    [10, 11], [11, 12], [10, 12],
    [13, 14], [14, 15], [13, 15],
    [16, 10], [17, 12], [17, 14],
    [18, 19], [15, 18],
    [5, 10], [11, 13],
  ],
};

/**
 * SCATTER — loose orbital ring with sparse middle. Sits well inside a card
 * so the ring frames the content without crowding it.
 */
const SCATTER: NetworkPreset = {
  width: 1100,
  height: 500,
  nodes: [
    // Outer top arc
    { x: 100,  y: 80,  r: 9  },
    { x: 280,  y: 50,  r: 8  },
    { x: 450,  y: 70,  r: 11 },
    { x: 620,  y: 60,  r: 8  },
    { x: 800,  y: 80,  r: 10 },
    { x: 970,  y: 100, r: 9  },
    // Outer sides
    { x: 60,   y: 250, r: 8  },
    { x: 1020, y: 270, r: 11 },
    // Outer bottom arc
    { x: 120,  y: 420, r: 10 },
    { x: 300,  y: 450, r: 8  },
    { x: 470,  y: 440, r: 9  },
    { x: 660,  y: 460, r: 11 },
    { x: 840,  y: 430, r: 8  },
    { x: 1010, y: 420, r: 9  },
    // Inner accents
    { x: 350,  y: 240, r: 8  },
    { x: 700,  y: 220, r: 9  },
  ],
  edges: [
    // outer ring
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    [0, 6], [5, 7],
    [6, 8], [7, 13],
    [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
    // inner spokes
    [1, 14], [2, 14], [9, 14], [10, 14],
    [4, 15], [11, 15], [12, 15], [3, 15],
    [14, 15],
  ],
};

/**
 * WEAVE — strong diagonal current with counter-diagonal cross-weave. Reads
 * as a flow / progression, fits a pricing or comparison section.
 */
const WEAVE: NetworkPreset = {
  width: 1200,
  height: 700,
  nodes: [
    // Main diagonal TL → BR
    { x: 80,   y: 110, r: 10 },
    { x: 230,  y: 200, r: 8  },
    { x: 390,  y: 280, r: 11 },
    { x: 540,  y: 360, r: 9  },
    { x: 700,  y: 440, r: 10 },
    { x: 860,  y: 520, r: 8  },
    { x: 1020, y: 600, r: 11 },
    // Counter-diagonal TR → BL
    { x: 1100, y: 130, r: 9  },
    { x: 950,  y: 220, r: 8  },
    { x: 800,  y: 290, r: 10 },
    { x: 600,  y: 220, r: 8  },
    { x: 450,  y: 130, r: 9  },
    { x: 280,  y: 80,  r: 8  },
    // Bottom-left support
    { x: 130,  y: 470, r: 8  },
    { x: 270,  y: 580, r: 10 },
    { x: 420,  y: 640, r: 9  },
    // Right-edge cluster
    { x: 1130, y: 350, r: 9  },
    { x: 1080, y: 460, r: 8  },
    { x: 1150, y: 560, r: 10 },
  ],
  edges: [
    // main diagonal
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    // counter diagonal
    [12, 11], [11, 10], [10, 9], [9, 8], [8, 7],
    // crossings (the weave)
    [1, 12], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
    // bottom-left support
    [3, 13], [13, 14], [14, 15], [15, 4],
    [1, 13], [14, 11],
    // right-edge cluster
    [5, 16], [16, 17], [17, 18], [18, 6], [9, 16],
    // small accents
    [0, 12],
  ],
};

/** Compact constellation, retained for small surfaces. */
const CONSTELLATION: NetworkPreset = {
  width: 600,
  height: 420,
  nodes: [
    { x: 60,  y: 70,  r: 7 },
    { x: 200, y: 40,  r: 8 },
    { x: 340, y: 100, r: 9 },
    { x: 480, y: 60,  r: 7 },
    { x: 560, y: 180, r: 8 },
    { x: 130, y: 200, r: 9 },
    { x: 280, y: 240, r: 8 },
    { x: 420, y: 220, r: 10 },
    { x: 80,  y: 340, r: 8 },
    { x: 240, y: 380, r: 9 },
    { x: 400, y: 360, r: 7 },
    { x: 540, y: 320, r: 9 },
  ],
  edges: [
    [0, 1], [0, 5], [1, 2], [1, 5], [2, 3], [2, 6], [2, 7],
    [3, 4], [3, 7], [4, 7], [4, 11], [5, 6], [5, 8], [6, 7],
    [6, 9], [7, 10], [7, 11], [8, 9], [9, 10], [10, 11],
  ],
};

/** Long horizontal mesh, retained for header bands. */
const MESH: NetworkPreset = {
  width: 1000,
  height: 260,
  nodes: [
    { x: 50,  y: 60,  r: 7 },
    { x: 180, y: 180, r: 8 },
    { x: 320, y: 50,  r: 9 },
    { x: 460, y: 170, r: 7 },
    { x: 600, y: 70,  r: 9 },
    { x: 740, y: 200, r: 8 },
    { x: 870, y: 80,  r: 7 },
    { x: 950, y: 200, r: 9 },
    { x: 110, y: 230, r: 6 },
    { x: 400, y: 250, r: 7 },
    { x: 670, y: 250, r: 6 },
  ],
  edges: [
    [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5],
    [4, 5], [4, 6], [5, 6], [5, 7], [6, 7], [0, 8], [1, 8], [3, 9],
    [5, 10], [7, 10], [8, 9], [9, 10],
  ],
};

const PRESETS = {
  ambient: AMBIENT,
  drift: DRIFT,
  grove: GROVE,
  scatter: SCATTER,
  weave: WEAVE,
  constellation: CONSTELLATION,
  mesh: MESH,
} as const;

export type ConnectedDotsVariant = keyof typeof PRESETS;

interface ConnectedDotsProps {
  variant?: ConnectedDotsVariant;
  /** Stroke width for the connecting lines, in viewBox units. */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

const DRAW_EASE = [0.23, 1, 0.32, 1] as const;

const FULL_BLEED_VARIANTS = new Set<ConnectedDotsVariant>([
  "ambient",
  "drift",
  "grove",
  "scatter",
  "weave",
]);

export function ConnectedDots({
  variant = "ambient",
  strokeWidth,
  className,
  style,
}: ConnectedDotsProps): ReactNode {
  const preset = PRESETS[variant];
  const sw =
    strokeWidth ??
    (FULL_BLEED_VARIANTS.has(variant) ? 2.6 : variant === "mesh" ? 2.2 : 2.0);
  const uid = useId();
  const fadeId = `fade-${uid}`;
  const knockoutId = `knockout-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${preset.width} ${preset.height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={style}
      fill="none"
    >
      <defs>
        {/* Soft radial fade so the network melts into surroundings */}
        <radialGradient id={`${fadeId}-grad`} cx="50%" cy="50%" r="65%">
          <stop offset="0"   stopColor="white" stopOpacity="1"    />
          <stop offset="0.6" stopColor="white" stopOpacity="0.85" />
          <stop offset="1"   stopColor="white" stopOpacity="0"    />
        </radialGradient>

        <mask id={fadeId}>
          <rect
            x="0"
            y="0"
            width={preset.width}
            height={preset.height}
            fill={`url(#${fadeId}-grad)`}
          />
        </mask>

        {/* Knockout: lines are hidden under each node so connections
            terminate cleanly at the rim instead of slicing through. */}
        <mask id={knockoutId}>
          <rect
            x="0"
            y="0"
            width={preset.width}
            height={preset.height}
            fill="white"
          />
          {preset.nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={(n.r ?? 7) + 2}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      <g mask={`url(#${fadeId})`}>
        {/* Base lines — drawn in once on view, then static */}
        <g
          mask={`url(#${knockoutId})`}
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          opacity="0.6"
        >
          {preset.edges.map(([a, b], i) => {
            const na = preset.nodes[a]!;
            const nb = preset.nodes[b]!;
            return (
              <motion.line
                key={`base-${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.6 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  pathLength: {
                    duration: 1.4,
                    delay: 0.04 * i,
                    ease: DRAW_EASE,
                  },
                  opacity: {
                    duration: 0.6,
                    delay: 0.04 * i,
                  },
                }}
              />
            );
          })}
        </g>

        {/* Subtle breath — same lines, very faint, infinite & staggered.
            Most lines are dim most of the time; one or two brighten
            briefly at any given moment. Reads as an alive surface, not
            a marching pulse. */}
        <g
          mask={`url(#${knockoutId})`}
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
        >
          {preset.edges.map(([a, b], i) => {
            const na = preset.nodes[a]!;
            const nb = preset.nodes[b]!;
            const cycle = 6 + (i % 4);
            const pause = 2 + ((i * 1.7) % 4);
            const phase = (i * 0.8) % 6;
            return (
              <motion.line
                key={`breath-${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.28, 0] }}
                transition={{
                  duration: cycle,
                  delay: 1.8 + phase,
                  repeat: Infinity,
                  repeatDelay: pause,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </g>

        {/* Nodes — fade in once, then static */}
        {preset.nodes.map((n, i) => {
          const r = n.r ?? 7;
          return (
            <motion.circle
              key={`node-${i}`}
              cx={n.x}
              cy={n.y}
              r={r}
              fill="currentColor"
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.7,
                delay: 0.05 * i + 0.35,
                ease: DRAW_EASE,
              }}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            />
          );
        })}
      </g>
    </svg>
  );
}
