"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NavPoint } from "@/lib/types";
import { fmtNum } from "@/lib/format";

type Range = "24h" | "7d" | "30d" | "all";

interface NavChartProps {
  data: NavPoint[];
  range?: Range;
  height?: number;
}

const RANGE_DAYS: Record<Range, number> = { "24h": 2, "7d": 7, "30d": 30, all: Infinity };

/** Area + line NAV chart with a mouse-tracked crosshair tooltip.
   Hand-rolled SVG (zero deps); swap for recharts <AreaChart> when wiring
   the real performanceHistory. */
export function NavChart({ data, range = "all", height = 280 }: NavChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId().replace(/:/g, "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setW(Math.max(280, cr.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slice = useMemo(() => {
    const n = RANGE_DAYS[range];
    if (!Number.isFinite(n)) return data;
    return data.slice(Math.max(0, data.length - n));
  }, [data, range]);

  const pad = { l: 8, r: 8, t: 14, b: 18 };
  const vals = slice.map((d) => d.nav);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const X = (i: number) => pad.l + (i / (slice.length - 1 || 1)) * innerW;
  const Y = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;

  const line = slice
    .map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(d.nav).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${X(slice.length - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${X(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;

  const up = slice.length > 1 && slice[slice.length - 1].nav >= slice[0].nav;
  const stroke = up ? "var(--up)" : "var(--down)";

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let i = Math.round(((x - pad.l) / innerW) * (slice.length - 1));
    i = Math.max(0, Math.min(slice.length - 1, i));
    setHover(i);
  }

  const tipDate = (t: number) =>
    new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <svg
        width={w}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + innerH * f}
            y2={pad.t + innerH * f}
            stroke="var(--line-2)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hover != null && (
          <g>
            <line
              x1={X(hover)}
              x2={X(hover)}
              y1={pad.t}
              y2={pad.t + innerH}
              stroke="var(--muted-2)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={X(hover)} cy={Y(slice[hover].nav)} r="4.5" fill={stroke} stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div
          style={{
            position: "absolute",
            top: 6,
            pointerEvents: "none",
            left: Math.max(4, Math.min(w - 150, X(hover) - 70)),
            background: "var(--ink)",
            color: "#fff",
            borderRadius: 8,
            padding: "7px 10px",
            boxShadow: "var(--shadow-md)",
            minWidth: 120,
          }}
        >
          <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
            {fmtNum(slice[hover].nav, 4)}
          </div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{tipDate(slice[hover].t)}</div>
        </div>
      )}
    </div>
  );
}
