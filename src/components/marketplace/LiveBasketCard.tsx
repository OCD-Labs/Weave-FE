"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { UiBasketSummary } from "@/lib/api/map";
import { usePerformance } from "@/lib/api/hooks";
import { fmtUsdCompact, fmtPct } from "@/lib/format";
import { fromUnits } from "@/lib/units";
import { RebalBadge } from "../badges";
import { Spark } from "../Spark";

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Marketplace card backed by the live GET /baskets summary, which now includes
   24h NAV change and inline constituents. A sparkline is layered on from the
   per-basket performance history. */
export function LiveBasketCard({ basket }: { basket: UiBasketSummary }) {
  const up = basket.navChg24 >= 0;
  const extra = basket.constituentCount - 5;

  // Sparkline from the last ~30 NAV points (API navPerToken is 6-decimal).
  const { data: perf } = usePerformance(basket.address);
  const sparkData = useMemo(
    () =>
      (perf ?? []).slice(-30).map((p) => ({
        t: p.timestamp * 1000,
        nav: fromUnits(p.navPerToken, 6),
      })),
    [perf]
  );

  return (
    <Link
      href={`/baskets/${basket.slug}`}
      className="card basket-card block cursor-pointer overflow-hidden p-0"
    >
      <div style={{ padding: "20px 20px 16px" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 18 }}>{basket.name}</h3>
              <span className="tag">{basket.symbol}</span>
            </div>
            <div className="muted mono" style={{ fontSize: 12, marginTop: 5 }}>
              by {shortAddr(basket.creator)}
            </div>
          </div>
          {basket.suspended ? (
            <span className="badge badge-warn">
              <span className="dot" /> Suspended
            </span>
          ) : sparkData.length > 1 ? (
            <Spark data={sparkData} up={up} />
          ) : null}
        </div>
        <p
          className="muted line-clamp-2"
          style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.5, minHeight: 40 }}
        >
          {basket.thesis}
        </p>
      </div>

      {basket.constituents.length > 0 && (
        <div style={{ display: "flex", gap: 6, padding: "0 20px 14px", flexWrap: "wrap" }}>
          {basket.constituents.slice(0, 5).map((c) => (
            <span key={c.sym} className="tag" style={{ fontSize: 11 }}>
              {c.sym}
            </span>
          ))}
          {extra > 0 && (
            <span className="tag" style={{ fontSize: 11 }}>
              +{extra}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderTop: "1px solid var(--line-2)",
          background: "var(--surface)",
          gap: 8,
        }}
      >
        <div>
          <div className="eyebrow" style={{ fontSize: 9.5 }}>
            AUM
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 750 }}>
            {fmtUsdCompact(basket.aum)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="eyebrow" style={{ fontSize: 9.5 }}>
            24h
          </div>
          <div className={`num ${up ? "up" : "down"}`} style={{ fontSize: 17, fontWeight: 750 }}>
            {fmtPct(basket.navChg24)}
          </div>
        </div>
        <RebalBadge on={basket.rebalancing} small />
      </div>
    </Link>
  );
}
