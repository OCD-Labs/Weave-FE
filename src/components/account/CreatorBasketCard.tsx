"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { UiCreatorBasket } from "@/lib/api/map";
import { fmtUsd, fmtUsdCompact, ago } from "@/lib/format";
import { isRealAddress } from "@/lib/web3/addresses";
import { useClaimAll, useCreatorOwnership } from "@/lib/web3/useCreatorToken";
import { useToast } from "../toast/ToastProvider";
import { KV } from "./primitives";

function shortAddr(a: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(a) ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function CreatorBasketCard({ c }: { c: UiCreatorBasket }) {
  const { toast } = useToast();
  const live = isRealAddress(c.creatorToken);
  const ownership = useCreatorOwnership(live ? (c.creatorToken as `0x${string}`) : undefined);
  const { busy, phase, error, claimAll, reset } = useClaimAll(
    (live ? c.creatorToken : "0x0000000000000000000000000000000000000000") as `0x${string}`
  );

  // Scale against the largest actual snapshot (not a $1 floor) so sub-dollar
  // testnet revenues still render as proportional bars instead of flat minimums.
  const maxRev = Math.max(...c.revenue.map((r) => r.usdg), 0) || 1;
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  // Mock baskets always show 100% ownership; live reads from contract (null while loading).
  const ownershipLabel = live ? (ownership === null ? "…" : `${ownership.toFixed(0)}%`) : "100%";

  useEffect(() => {
    if (!live) return;
    if (phase === "claiming") toast(`Claiming from ${c.name}…`, "pending");
    if (phase === "success") {
      toast(`Claimed from ${c.name}.`, "success");
      reset();
    }
    if (phase === "error" && error) {
      toast(error, "error");
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function claim() {
    if (live) {
      claimAll();
      return;
    }
    toast(`Claiming from ${c.name}…`, "pending");
    setTimeout(() => toast(`Claimed ${fmtUsd(c.claimable)}`, "success"), 1200);
  }

  return (
    <div className="card card-pad">
      <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: basket info + claim */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/baskets/${c.slug}`}>
              <h3 style={{ fontSize: 19 }}>{c.name}</h3>
            </Link>
            <span className="tag">{c.symbol}</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <KV k="AUM" v={fmtUsdCompact(c.aum)} />
            <KV k="Your ownership" v={ownershipLabel} />
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
              disabled={c.claimable < 0.01 || busy}
              onClick={claim}
            >
              {busy ? "Claiming…" : "Claim"}
            </button>
          </div>

          <div className="muted" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5 }}>
            Creator token{" "}
            <span className="mono" style={{ color: "var(--ink-2)" }}>
              {shortAddr(c.creatorToken)}
            </span>{" "}
            · transferable · selling it transfers future revenue rights.
          </div>
        </div>

        {/* Right: revenue-per-snapshot bar chart */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Revenue per snapshot
          </div>
          {c.revenue.length > 0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-start",
                  gap: 6,
                  height: 130,
                }}
              >
                {c.revenue.map((r, i) => {
                  const last = i === c.revenue.length - 1;
                  return (
                    <div
                      key={r.id}
                      onMouseEnter={() => setHoverBar(i)}
                      onMouseLeave={() => setHoverBar(null)}
                      aria-label={`${fmtUsd(r.usdg)}, ${last ? "latest" : ago(r.t)}`}
                      style={{
                        flex: "1 1 0",
                        maxWidth: 48,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "70%",
                          height: `${(r.usdg / maxRev) * 100}%`,
                          background: last ? "var(--accent)" : "var(--accent-tint-2)",
                          borderRadius: "4px 4px 0 0",
                          minHeight: 4,
                          transition: "height 0.3s cubic-bezier(0.22,0.7,0.25,1)",
                        }}
                      >
                        {hoverBar === i && (
                          <div
                            role="tooltip"
                            style={{
                              position: "absolute",
                              bottom: "calc(100% + 8px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "var(--ink)",
                              color: "#fff",
                              padding: "6px 9px",
                              borderRadius: 8,
                              fontSize: 11.5,
                              lineHeight: 1.35,
                              whiteSpace: "nowrap",
                              textAlign: "center",
                              boxShadow: "var(--shadow-md)",
                              pointerEvents: "none",
                              zIndex: 20,
                            }}
                          >
                            <div className="num" style={{ fontWeight: 700 }}>
                              {fmtUsd(r.usdg)}
                            </div>
                            <div style={{ opacity: 0.7 }}>{last ? "Latest" : ago(r.t)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="muted"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontSize: 11,
                }}
              >
                <span>
                  {c.revenue.length === 1 ? "1 snapshot ago" : `${c.revenue.length} snapshots ago`}
                </span>
                <span>Latest</span>
              </div>
            </>
          ) : (
            <div
              className="muted"
              style={{
                height: 130,
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                background: "var(--surface)",
                borderRadius: "var(--r-sm)",
              }}
            >
              No revenue snapshots yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
