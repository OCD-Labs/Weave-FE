import Link from "next/link";
import type { Basket } from "@/lib/types";
import { fmtUsdCompact, fmtPct } from "@/lib/format";
import { Spark } from "../Spark";
import { RebalBadge } from "../badges";

export function BasketCard({ basket }: { basket: Basket }) {
  const up = basket.navChg24 >= 0;
  const extra = basket.constituents.length - 5;

  return (
    <Link
      href={`/baskets/${basket.slug}`}
      className="card basket-card block cursor-pointer overflow-hidden p-0"
    >
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 18 }}>{basket.name}</h3>
              <span className="tag">{basket.symbol}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>
              by {basket.creatorName}
            </div>
          </div>
          <Spark data={basket.history.slice(-30)} up={up} />
        </div>
        <p
          className="muted line-clamp-2"
          style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.5, minHeight: 40 }}
        >
          {basket.thesis}
        </p>
      </div>

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
