"use client";

import { DATA_TOGGLE_ENABLED, useDataSource, setDataSource } from "@/lib/dataSource";

/** Dev-only floating switch to flip between live API and mock data.
   Renders nothing unless NEXT_PUBLIC_ENABLE_DATA_TOGGLE=1. */
export function DataSourceToggle() {
  const source = useDataSource();
  if (!DATA_TOGGLE_ENABLED) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <span className="eyebrow" style={{ fontSize: 9.5 }}>
        Data
      </span>
      <div style={{ display: "inline-flex", background: "var(--surface-2)", borderRadius: 999, padding: 3 }}>
        {(["live", "mock"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setDataSource(s)}
            style={{
              height: 26,
              padding: "0 12px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              textTransform: "capitalize",
              color: source === s ? "var(--ink)" : "var(--muted)",
              background: source === s ? "var(--card)" : "transparent",
              boxShadow: source === s ? "var(--shadow-sm)" : "none",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
