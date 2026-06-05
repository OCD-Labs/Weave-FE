"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading the Robinhood Chain catalogue…",
  "Cross-referencing sectors and market caps…",
  "Pulling live Chainlink prices…",
  "Selecting stocks and setting weights…",
  "Writing the rationale…",
];

export function AILoading() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => Math.min(p + 1, MESSAGES.length - 1)), 520);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="card"
      style={{
        marginTop: 24,
        padding: 22,
        background: "var(--accent-tint)",
        border: "none",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div className="ai-orb" aria-hidden="true" />
      <div>
        <div style={{ fontWeight: 700, color: "var(--accent-strong)" }}>Composing your basket</div>
        <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }} aria-live="polite">
          {MESSAGES[i]}
        </div>
      </div>
    </div>
  );
}
