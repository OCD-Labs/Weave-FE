"use client";

import Link from "next/link";
import type { CreatedBasket } from "@/lib/types";
import { fmtUsd, fmtUsdCompact } from "@/lib/format";
import { useToast } from "../toast/ToastProvider";
import { RebalBadge } from "../badges";
import { KV } from "./primitives";

export function CreatorBasketCard({ c }: { c: CreatedBasket }) {
  const { toast } = useToast();
  const b = c.basket;
  const maxRev = Math.max(...c.revenue.map((r) => r.usdc));

  function claim() {
    toast(`Claiming from ${b.name}…`, "pending");
    setTimeout(() => toast(`Claimed ${fmtUsd(c.claimable)}`, "success"), 1200);
  }

  return (
    <div className="card card-pad">
      <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: basket info + claim */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/baskets/${b.slug}`}>
              <h3 style={{ fontSize: 19 }}>{b.name}</h3>
            </Link>
            <span className="tag">{b.symbol}</span>
            <RebalBadge on={b.rebalancing} small />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <KV k="AUM" v={fmtUsdCompact(b.aum)} />
            <KV k="Your ownership" v={`${c.ownershipPct.toFixed(0)}%`} />
            <KV k="Earned to date" v={fmtUsd(c.totalEarned)} />
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 180,
                padding: "12px 14px",
                background: "var(--accent-tint)",
                borderRadius: "var(--r-sm)",
              }}
            >
              <div className="eyebrow" style={{ fontSize: 9.5, color: "var(--accent-strong)" }}>
                Claimable now
              </div>
              <div
                className="num"
                style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-strong)" }}
              >
                {fmtUsd(c.claimable)}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={c.claimable < 0.01}
              onClick={claim}
            >
              Claim
            </button>
          </div>

          <div className="muted" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5 }}>
            Creator token{" "}
            <span className="mono" style={{ color: "var(--ink-2)" }}>
              {c.creatorToken}
            </span>{" "}
            · transferable · selling it transfers future revenue rights.
          </div>
        </div>

        {/* Right: revenue-per-snapshot bar chart */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Revenue per snapshot
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
            {c.revenue.map((r, i) => {
              const last = i === c.revenue.length - 1;
              return (
                <div
                  key={r.id}
                  title={fmtUsd(r.usdc)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "70%",
                      height: `${(r.usdc / maxRev) * 100}%`,
                      background: last ? "var(--accent)" : "var(--accent-tint-2)",
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                      transition: "height 0.3s cubic-bezier(0.22,0.7,0.25,1)",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="muted"
            style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}
          >
            <span>12 snapshots ago</span>
            <span>Latest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
