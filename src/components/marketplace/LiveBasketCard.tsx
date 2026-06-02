import Link from "next/link";
import type { UiBasketSummary } from "@/lib/api/map";
import { fmtUsdCompact, fmtUsd } from "@/lib/format";
import { RebalBadge } from "../badges";

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/** Marketplace card backed by the live GET /baskets summary. The list endpoint
   omits 24h change, sparkline, and constituents, so this shows what's actually
   available (NAV, AUM, creator, rebalancing) without fabricating data. */
export function LiveBasketCard({ basket }: { basket: UiBasketSummary }) {
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
          {basket.suspended && (
            <span className="badge badge-warn">
              <span className="dot" /> Suspended
            </span>
          )}
        </div>
        <p
          className="muted line-clamp-2"
          style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.5, minHeight: 40 }}
        >
          {basket.thesis}
        </p>
      </div>

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
            NAV / token
          </div>
          <div className="num" style={{ fontSize: 17, fontWeight: 750 }}>
            {fmtUsd(basket.nav)}
          </div>
        </div>
        <RebalBadge on={basket.rebalancing} small />
      </div>
    </Link>
  );
}
