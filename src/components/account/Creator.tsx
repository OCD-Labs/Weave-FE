"use client";

import { CREATED } from "@/lib/data";
import { fmtUsd, fmtUsdCompact } from "@/lib/format";
import { useWallet } from "../wallet/WalletProvider";
import { useToast } from "../toast/ToastProvider";
import { ConnectGate, BigStat } from "./primitives";
import { CreatorBasketCard } from "./CreatorBasketCard";

export function Creator() {
  const { connected } = useWallet();
  const { toast } = useToast();

  if (!connected) {
    return (
      <ConnectGate
        title="Connect to open your creator dashboard"
        sub="Track the baskets you've published, your creator-token ownership, and revenue you can claim — earned continuously through ERC-7641."
      />
    );
  }

  const created = CREATED;
  const totalClaimable = created.reduce((s, c) => s + c.claimable, 0);
  const totalEarned = created.reduce((s, c) => s + c.totalEarned, 0);
  const totalAum = created.reduce((s, c) => s + c.basket.aum, 0);

  function claimAll() {
    toast(`Claiming from ${created.length} baskets…`, "pending");
    setTimeout(
      () => toast(`Claimed ${fmtUsd(totalClaimable)} across all baskets`, "success"),
      1600
    );
  }

  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 36, paddingBottom: 64 }}>
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
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={claimAll}
          disabled={totalClaimable < 0.01}
        >
          Claim all · {fmtUsd(totalClaimable)}
        </button>
      </div>

      <div className="my-6 grid grid-cols-2 gap-[var(--gap)] md:grid-cols-4">
        <BigStat label="Claimable now" value={fmtUsd(totalClaimable)} cls="up" />
        <BigStat label="Earned to date" value={fmtUsd(totalEarned)} />
        <BigStat label="AUM across baskets" value={fmtUsdCompact(totalAum)} />
        <BigStat label="Baskets published" value={created.length} />
      </div>

      <div className="grid gap-[var(--gap)]">
        {created.map((c) => (
          <CreatorBasketCard key={c.basket.address} c={c} />
        ))}
      </div>
    </div>
  );
}
