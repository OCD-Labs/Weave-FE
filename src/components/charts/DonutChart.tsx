"use client";

import { useState } from "react";
import type { Constituent } from "@/lib/types";
import { bps } from "@/lib/format";

interface DonutChartProps {
  slices: Constituent[];
  size?: number;
  thickness?: number;
  /** Use target weights instead of current (drifted) weights. */
  useTarget?: boolean;
  /** Highlighted slice index (controlled from a parent for list↔donut sync). */
  active?: number | null;
  onHover?: (i: number | null) => void;
}

/** Donut composition chart. Hovering a slice widens + recolors it to accent
   and reports the index up so a sibling list can dim in sync. */
export function DonutChart({
  slices,
  size = 184,
  thickness = 26,
  useTarget = false,
  active,
  onHover,
}: DonutChartProps) {
  const [internal, setInternal] = useState<number | null>(null);
  const hi = active !== undefined ? active : internal;

  const weight = (c: Constituent) => (useTarget ? c.target : c.current);
  const total = slices.reduce((s, c) => s + weight(c), 0) || 1;
  const R = size / 2;
  const r = R - thickness / 2;
  const C = 2 * Math.PI * r;

  // Stable palette derived from index — deterministic, SSR-safe.
  const palette = slices.map(
    (_, i) => `hsl(${(200 + i * 47) % 360} ${64 - (i % 6) * 2}% ${56 - (i % 3) * 6}%)`
  );

  function setHover(i: number | null) {
    setInternal(i);
    onHover?.(i);
  }

  let acc = 0;
  const segments = slices.map((c, i) => {
    const len = (weight(c) / total) * C;
    const seg = (
      <circle
        key={c.sym}
        cx={R}
        cy={R}
        r={r}
        fill="none"
        stroke={i === hi ? "var(--accent)" : palette[i]}
        strokeWidth={i === hi ? thickness + 4 : thickness}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-acc}
        style={{ transition: "stroke-width 0.12s" }}
        onMouseEnter={() => setHover(i)}
        onMouseLeave={() => setHover(null)}
      />
    );
    acc += len;
    return seg;
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
        {segments}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        {hi == null ? (
          <>
            <div className="eyebrow" style={{ fontSize: 10 }}>
              Holdings
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {slices.length}
            </div>
          </>
        ) : (
          <>
            <span className="tag" style={{ fontSize: 12 }}>
              {slices[hi].sym}
            </span>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
              {bps(weight(slices[hi]))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
