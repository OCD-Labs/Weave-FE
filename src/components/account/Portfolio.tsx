"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePositions } from "@/lib/api/hooks";
import { mapPortfolio, type UiPosition, type UiPortfolio } from "@/lib/api/map";
import { POSITIONS } from "@/lib/data";
import { useDataSource } from "@/lib/dataSource";
import { fmtUsd, fmtPct, fmtNum } from "@/lib/format";
import { useWallet } from "../wallet/WalletProvider";
import { RebalBadge } from "../badges";
import { ConnectGate, BigStat, KV } from "./primitives";
import { QuickRedeem } from "./QuickRedeem";

function shortAddr(a: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(a) ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/** Build the mock portfolio in the same UiPortfolio shape as the live API. */
function mockPortfolio(): UiPortfolio {
  const positions: UiPosition[] = POSITIONS.map((p) => ({
    basketAddress: p.basket.address,
    slug: p.basket.slug,
    name: p.basket.name,
    symbol: p.basket.symbol,
    rebalancing: p.basket.rebalancing,
    suspended: p.basket.suspended ?? false,
    tokens: p.tokens,
    value: p.value,
    deposited: p.deposited,
    pnl: p.pnl,
    pnlPct: p.pnlPct,
    nav: p.basket.nav,
    constituents: p.basket.constituents.map((c) => ({
      sym: c.sym,
      targetWeightBps: c.target,
      sector: c.sector,
    })),
  }));
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const totalDeposited = positions.reduce((s, p) => s + p.deposited, 0);
  const totalPnl = totalValue - totalDeposited;
  return {
    totalValue,
    totalDeposited,
    totalPnl,
    totalPnlPct: totalDeposited ? (totalPnl / totalDeposited) * 100 : 0,
    positions,
  };
}

export function Portfolio() {
  const { connected, address, fullAddress } = useWallet();
  const dataSource = useDataSource();
  const isMock = dataSource === "mock";
  const [redeemFor, setRedeemFor] = useState<UiPosition | null>(null);

  const { data, isLoading, isError, error, refetch } = usePositions(
    isMock ? undefined : fullAddress
  );

  const portfolio = useMemo<UiPortfolio | null>(() => {
    if (isMock) return mockPortfolio();
    return data ? mapPortfolio(data) : null;
  }, [isMock, data]);

  if (!connected) {
    return (
      <ConnectGate
        title="Connect to view your portfolio"
        sub="See every index position you hold, your cost basis, and unrealised performance across the protocol."
      />
    );
  }

  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <h1 style={{ fontSize: 30 }}>Portfolio</h1>
      <p className="muted" style={{ marginTop: 6, fontSize: 14, marginBottom: 24 }}>
        Positions for <span className="mono">{shortAddr(address)}</span>
      </p>

      {!isMock && isLoading ? (
        <PortfolioSkeleton />
      ) : !isMock && isError ? (
        <ErrorCard
          message={error instanceof Error ? error.message : "Failed to load your portfolio."}
          onRetry={() => refetch()}
        />
      ) : !portfolio || portfolio.positions.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <>
          <div className="mb-[26px] grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
            <BigStat label="Portfolio value" value={fmtUsd(portfolio.totalValue)} />
            <BigStat label="Total invested" value={fmtUsd(portfolio.totalDeposited)} />
            <BigStat
              label="Unrealised P&L"
              value={fmtUsd(portfolio.totalPnl)}
              cls={portfolio.totalPnl >= 0 ? "up" : "down"}
              prefix={portfolio.totalPnl >= 0 ? "+" : ""}
            />
            <BigStat
              label="Return"
              value={fmtPct(portfolio.totalPnlPct)}
              cls={portfolio.totalPnl >= 0 ? "up" : "down"}
            />
          </div>

          <div className="grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-2">
            {portfolio.positions.map((p) => (
              <div key={p.basketAddress} className="card" style={{ overflow: "hidden" }}>
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
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                      >
                        <Link href={`/baskets/${p.slug}`}>
                          <h3 style={{ fontSize: 17 }}>{p.name}</h3>
                        </Link>
                        <span className="tag">{p.symbol}</span>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <RebalBadge on={p.rebalancing} small />
                        {p.suspended && (
                          <span className="badge badge-warn">
                            <span className="dot" /> Suspended
                          </span>
                        )}
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
                    <KV k="NAV" v={fmtUsd(p.nav)} />
                  </div>

                  {p.constituents.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                      {p.constituents.slice(0, 5).map((c) => (
                        <span key={c.sym} className="tag" style={{ fontSize: 11 }}>
                          {c.sym}
                        </span>
                      ))}
                    </div>
                  )}
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
                  <Link href={`/baskets/${p.slug}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>View index</Link>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    style={{ flex: 1 }}
                    disabled={p.suspended}
                    onClick={() => setRedeemFor(p)}
                  >
                    Quick redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {redeemFor && <QuickRedeem p={redeemFor} onClose={() => setRedeemFor(null)} />}
    </div>
  );
}

function EmptyPortfolio() {
  return (
    <div className="card card-pad" style={{ textAlign: "center", padding: "56px 24px" }}>
      <h2 style={{ fontSize: 20 }}>No positions yet</h2>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        Deposit into an index and it will show up here with your cost basis and live performance.
      </p>
      <Link href="/markets" className="btn btn-primary" style={{ marginTop: 18 }}>Browse indexes</Link>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card card-pad" style={{ textAlign: "center" }}>
      <div className="down" style={{ fontWeight: 700, fontSize: 16 }}>
        Couldn&apos;t load your portfolio
      </div>
      <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
        {message}
      </p>
      <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <>
      <div className="mb-[26px] grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card card-pad">
            <div className="skel" style={{ height: 12, width: "60%" }} />
            <div className="skel" style={{ height: 26, width: "80%", marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card" style={{ height: 200, padding: 20 }}>
            <div className="skel" style={{ height: "100%", width: "100%" }} />
          </div>
        ))}
      </div>
    </>
  );
}
