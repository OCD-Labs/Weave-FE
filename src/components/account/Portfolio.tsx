"use client";

import { useState } from "react";
import Link from "next/link";
import type { Position } from "@/lib/types";
import { POSITIONS, WALLET } from "@/lib/data";
import { fmtUsd, fmtPct, fmtNum } from "@/lib/format";
import { useWallet } from "../wallet/WalletProvider";
import { RebalBadge } from "../badges";
import { ConnectGate, BigStat, KV } from "./primitives";
import { QuickRedeem } from "./QuickRedeem";

export function Portfolio() {
  const { connected } = useWallet();
  const [redeemFor, setRedeemFor] = useState<Position | null>(null);

  if (!connected) {
    return (
      <ConnectGate
        title="Connect to view your portfolio"
        sub="See every basket position you hold, your cost basis, and unrealised performance across the protocol."
      />
    );
  }

  const ps = POSITIONS;
  const totalValue = ps.reduce((s, p) => s + p.value, 0);
  const totalDep = ps.reduce((s, p) => s + p.deposited, 0);
  const totalPnl = totalValue - totalDep;
  const totalPnlPct = (totalPnl / totalDep) * 100;

  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 30 }}>Portfolio</h1>
      <p className="muted" style={{ marginTop: 6, fontSize: 14, marginBottom: 24 }}>
        Positions for <span className="mono">{WALLET}</span>
      </p>

      <div className="mb-[26px] grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
        <BigStat label="Portfolio value" value={fmtUsd(totalValue)} />
        <BigStat label="Total invested" value={fmtUsd(totalDep)} />
        <BigStat
          label="Unrealised P&L"
          value={fmtUsd(totalPnl)}
          cls={totalPnl >= 0 ? "up" : "down"}
          prefix={totalPnl >= 0 ? "+" : ""}
        />
        <BigStat label="Return" value={fmtPct(totalPnlPct)} cls={totalPnl >= 0 ? "up" : "down"} />
      </div>

      <div className="grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-2">
        {ps.map((p) => {
          const b = p.basket;
          return (
            <div key={p.addr} className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/baskets/${b.slug}`}>
                        <h3 style={{ fontSize: 17 }}>{b.name}</h3>
                      </Link>
                      <span className="tag">{b.symbol}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <RebalBadge on={b.rebalancing} small />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="num" style={{ fontSize: 22, fontWeight: 800 }}>
                      {fmtUsd(p.value)}
                    </div>
                    <div
                      className={`num ${p.pnl >= 0 ? "up" : "down"}`}
                      style={{ fontSize: 13.5, fontWeight: 700, marginTop: 2 }}
                    >
                      {p.pnl >= 0 ? "+" : ""}
                      {fmtUsd(p.pnl)} · {fmtPct(p.pnlPct)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <KV k="Balance" v={fmtNum(p.tokens, 2)} />
                  <KV k="Cost basis" v={fmtUsd(p.deposited)} />
                  <KV k="NAV" v={fmtUsd(b.nav)} />
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {b.constituents.slice(0, 5).map((c) => (
                    <span key={c.sym} className="tag" style={{ fontSize: 11 }}>
                      {c.sym}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "12px 20px",
                  borderTop: "1px solid var(--line-2)",
                  background: "var(--surface)",
                }}
              >
                <Link
                  href={`/baskets/${b.slug}`}
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                >
                  View basket
                </Link>
                <button
                  type="button"
                  className="btn btn-subtle btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setRedeemFor(p)}
                >
                  Quick redeem
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {redeemFor && <QuickRedeem p={redeemFor} onClose={() => setRedeemFor(null)} />}
    </div>
  );
}
