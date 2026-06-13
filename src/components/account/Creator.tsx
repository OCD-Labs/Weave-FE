"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCreator } from "@/lib/api/hooks";
import { mapCreatorDashboard, type UiCreatorDashboard } from "@/lib/api/map";
import { CREATED } from "@/lib/data";
import { useDataSource } from "@/lib/dataSource";
import { fmtUsd, fmtUsdCompact } from "@/lib/format";
import { useWallet } from "../wallet/WalletProvider";
import { ConnectGate, BigStat } from "./primitives";
import { CreatorBasketCard } from "./CreatorBasketCard";

/** Mock creator dashboard mapped to the same UiCreatorDashboard shape. */
function mockDashboard(): UiCreatorDashboard {
  const baskets = CREATED.map((c) => ({
    basketAddress: c.basket.address,
    slug: c.basket.slug,
    name: c.basket.name,
    symbol: c.basket.symbol,
    creatorToken: c.creatorToken,
    aum: c.basket.aum,
    claimable: c.claimable,
    totalEarned: c.totalEarned,
    revenue: c.revenue.map((r) => ({ id: r.id, usdg: r.usdg, t: r.t })),
    claimHistory: [],
  }));
  return {
    totalClaimable: baskets.reduce((s, b) => s + b.claimable, 0),
    totalEarned: baskets.reduce((s, b) => s + b.totalEarned, 0),
    totalAum: baskets.reduce((s, b) => s + b.aum, 0),
    baskets,
  };
}

export function Creator() {
  const { connected, fullAddress } = useWallet();
  const dataSource = useDataSource();
  const isMock = dataSource === "mock";
  const [openAddress, setOpenAddress] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useCreator(
    isMock ? undefined : fullAddress
  );

  const dash = useMemo<UiCreatorDashboard | null>(() => {
    if (isMock) return mockDashboard();
    return data ? mapCreatorDashboard(data) : null;
  }, [isMock, data]);

  if (!connected) {
    return (
      <ConnectGate
        title="Connect to open your creator dashboard"
        sub="Track the baskets you've published, your creator-token ownership, and revenue you can claim — earned continuously through ERC-7641."
      />
    );
  }

  return (
    <div className="wrap-wide w-full reveal" style={{ paddingTop: 36, paddingBottom: 64 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 30 }}>Creator Dashboard</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            Revenue from baskets you&apos;ve published, via ERC-7641.
          </p>
        </div>
        {dash && dash.baskets.length > 0 && (
          <div className="card card-pad" style={{ padding: "12px 16px", textAlign: "right" }}>
            <div className="eyebrow" style={{ fontSize: 9.5 }}>
              Total claimable
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: "var(--up)" }}>
              {fmtUsd(dash.totalClaimable)}
            </div>
          </div>
        )}
      </div>

      {!isMock && isLoading ? (
        <CreatorSkeleton />
      ) : !isMock && isError ? (
        <div className="card card-pad mt-6 text-center">
          <div className="down" style={{ fontWeight: 700, fontSize: 16 }}>
            Couldn&apos;t load your creator dashboard
          </div>
          <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : !dash || dash.baskets.length === 0 ? (
        <EmptyCreator />
      ) : (
        <>
          <div className="my-6 grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
            <BigStat label="Claimable now" value={fmtUsd(dash.totalClaimable)} cls="up" />
            <BigStat label="Earned to date" value={fmtUsd(dash.totalEarned)} />
            <BigStat label="AUM across baskets" value={fmtUsdCompact(dash.totalAum)} />
            <BigStat label="Baskets published" value={dash.baskets.length} />
          </div>

          <div className="grid gap-[var(--gap)]">
            {dash.baskets.map((c) => (
              <CreatorBasketCard
                key={c.basketAddress}
                c={c}
                open={openAddress === c.basketAddress}
                onToggle={() =>
                  setOpenAddress((prev) =>
                    prev === c.basketAddress ? null : c.basketAddress
                  )
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyCreator() {
  return (
    <div className="card card-pad mt-6" style={{ textAlign: "center", padding: "56px 24px" }}>
      <h2 style={{ fontSize: 20 }}>You haven&apos;t published any baskets</h2>
      <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
        Create a basket to start earning a continuous share of its management-fee revenue.
      </p>
      <Link href="/create" className="btn btn-primary" style={{ marginTop: 18 }}>Create a basket</Link>
    </div>
  );
}

function CreatorSkeleton() {
  return (
    <>
      <div className="my-6 w-full grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card card-pad">
            <div className="skel" style={{ height: 12, width: "60%" }} />
            <div className="skel" style={{ height: 26, width: "80%", marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="grid gap-[var(--gap)]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card" style={{ height: 200 }}>
            <div className="skel" style={{ height: "100%", width: "100%" }} />
          </div>
        ))}
      </div>
    </>
  );
}
