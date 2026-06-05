"use client";

import { useEffect } from "react";
import type { UiBasketDetail } from "@/lib/api/map";
import { bps } from "@/lib/format";
import { isRealAddress } from "@/lib/web3/addresses";
import { useRebalance } from "@/lib/web3/useTrade";
import { useToast } from "../toast/ToastProvider";
import { useWallet } from "../wallet/WalletProvider";
import { SpinIcon } from "../icons";

export function DriftIndicator({ basket }: { basket: UiBasketDetail }) {
  const { toast } = useToast();
  const { connected, connect } = useWallet();
  const live = isRealAddress(basket.address);
  const {
    phase: rebalPhase,
    error: rebalError,
    busy: rebalancing,
    rebalance,
  } = useRebalance((basket.address as `0x${string}`) ?? "0x0000000000000000000000000000000000000000");

  useEffect(() => {
    if (!live) return;
    if (rebalPhase === "rebalancing") toast("Confirm the rebalance in your wallet…", "pending");
    if (rebalPhase === "success") toast("Rebalance confirmed.", "success");
    if (rebalPhase === "error" && rebalError) toast(rebalError, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebalPhase]);

  function onRebalance() {
    if (!connected) {
      toast("Connect your wallet to rebalance", "error");
      connect();
      return;
    }
    if (live) rebalance();
    else toast("Rebalance transaction submitted", "pending");
  }

  const threshold = basket.driftBps ?? 0;
  const pct = threshold ? (basket.maxDriftBps / threshold) * 100 : 0;
  const needs = basket.needsRebalance;
  const warn = pct > 50 && !needs;
  const color = needs ? "var(--down)" : warn ? "var(--warn)" : "var(--up)";
  const tintBg = needs ? "var(--down-tint)" : warn ? "var(--warn-tint)" : "var(--up-tint)";

  return (
    <div className="card card-pad">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h3 style={{ fontSize: 17 }}>Rebalancing</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 3 }}>
            Max drift across holdings vs. {bps(threshold)} threshold
          </p>
        </div>
        {needs ? (
          <span className="badge badge-down">
            <span className="dot" /> Rebalance due
          </span>
        ) : warn ? (
          <span className="badge badge-warn">
            <span className="dot" /> Approaching threshold
          </span>
        ) : (
          <span className="badge badge-up">
            <span className="dot" /> Within tolerance
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 10,
              background: "var(--surface-2)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, pct)}%`,
                height: "100%",
                background: color,
                borderRadius: 6,
                transition: "width 0.5s cubic-bezier(0.22,0.7,0.25,1)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 12,
            }}
          >
            <span className="num muted">{bps(basket.maxDriftBps)} current drift</span>
            <span className="num muted">{bps(threshold)} threshold</span>
          </div>
        </div>
      </div>

      {needs && (
        <div style={{ marginTop: 14, padding: 14, background: tintBg, borderRadius: "var(--r-sm)" }}>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            A holding has drifted beyond the threshold. Anyone can trigger a rebalance — the caller
            pays gas as a public service. Funded indexes rebalance automatically via Chainlink.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: 10 }}
            disabled={rebalancing}
            onClick={onRebalance}
          >
            <SpinIcon /> {rebalancing ? "Rebalancing…" : "Rebalance now"}
          </button>
        </div>
      )}
    </div>
  );
}
