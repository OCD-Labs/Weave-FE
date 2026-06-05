"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { weaveApi } from "@/lib/api/client";
import { mapBasketDetail, type UiBasketDetail } from "@/lib/api/map";
import { qk } from "@/lib/api/hooks";
import { getBasketBySlug } from "@/lib/data";
import { useDataSource } from "@/lib/dataSource";
import type { Basket } from "@/lib/types";
import { BasketDetail } from "./BasketDetail";

/** Map a mock Basket into the same UiBasketDetail shape the live view uses. */
function mockToDetail(b: Basket): UiBasketDetail {
  return {
    address: b.address,
    slug: b.slug,
    creatorToken: b.address,
    creator: b.creatorName,
    name: b.name,
    symbol: b.symbol,
    thesis: b.thesis,
    rebalancing: b.rebalancing,
    driftBps: b.driftBps ?? 0,
    createdAt: b.createdAt,
    suspended: b.suspended ?? false,
    nav: b.nav,
    aum: b.aum,
    navChg24: b.navChg24,
    navChg7: b.navChg7,
    navChg30: b.navChg30,
    maxDriftBps: b.maxDriftBps,
    needsRebalance: b.needsRebalance,
    constituents: b.constituents.map((c) => ({
      address: "",
      sym: c.sym,
      name: c.name,
      sector: c.sector,
      target: c.target,
      current: c.current,
      price: c.price,
      chg: c.chg,
      value: 0,
    })),
    history: b.history,
    deposits: b.deposits.map((d) => ({
      investor: d.investor,
      usdc: d.usdc,
      tokens: d.tokens,
      t: d.t,
      txHash: "",
    })),
    rebalances: b.rebalances.map((r) => ({ tx: r.tx, by: r.by, t: r.t })),
  };
}

/** Resolves a basket by route slug from either the live API or the mock store,
   honouring the dev data-source toggle, then renders BasketDetail. */
export function BasketDetailView({ slug }: { slug: string }) {
  const dataSource = useDataSource();
  const isMock = dataSource === "mock";

  // In live mode the slug is the lowercased on-chain address.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.basket(slug),
    queryFn: () => weaveApi.basket(slug),
    enabled: !isMock,
    refetchInterval: 30_000,
  });

  if (isMock) {
    const mock = getBasketBySlug(slug);
    if (!mock) return <NotFound />;
    return <BasketDetail basket={mockToDetail(mock)} />;
  }

  if (isLoading) return <DetailSkeleton />;
  if (isError) {
    const msg = error instanceof Error ? error.message : "Failed to load this basket.";
    // 404 → not found; anything else → retryable error.
    if (/not found/i.test(msg)) return <NotFound />;
    return (
      <div className="wrap reveal" style={{ paddingTop: 60, paddingBottom: 80, maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: 24 }}>Couldn&apos;t load this index</h1>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>{msg}</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }
  if (!data) return <NotFound />;

  return <BasketDetail basket={mapBasketDetail(data)} />;
}

function NotFound() {
  return (
    <div className="wrap reveal" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 520, textAlign: "center" }}>
      <h1 style={{ fontSize: 26 }}>Index not found</h1>
      <p className="muted" style={{ marginTop: 10, fontSize: 15 }}>
        This index doesn&apos;t exist or hasn&apos;t been indexed yet.
      </p>
      <Link href="/markets" className="btn btn-primary" style={{ marginTop: 20 }}>
        Back to Markets
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="wrap-wide" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="skel" style={{ height: 14, width: 160, marginBottom: 20 }} />
      <div className="skel" style={{ height: 34, width: 320, marginBottom: 12 }} />
      <div className="skel" style={{ height: 16, width: "60%", marginBottom: 28 }} />
      <div className="grid grid-cols-1 gap-[var(--gap)] lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="card" style={{ height: 420 }}>
          <div className="skel" style={{ height: "100%", width: "100%" }} />
        </div>
        <div className="card" style={{ height: 360 }}>
          <div className="skel" style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
