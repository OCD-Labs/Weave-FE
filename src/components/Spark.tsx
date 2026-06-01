import type { NavPoint } from "@/lib/types";

interface SparkProps {
  data: NavPoint[];
  w?: number;
  h?: number;
  up?: boolean;
}

/** Tiny NAV sparkline (hand-rolled SVG; swap for recharts later if desired). */
export function Spark({ data, w = 92, h = 30, up = true }: SparkProps) {
  if (!data.length) return null;
  const vals = data.map((d) => d.nav);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const col = up ? "var(--up)" : "var(--down)";
  return (
    <svg width={w} height={h} style={{ display: "block" }} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={col}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
