"use client";

import { useEffect, useState } from "react";
import type { UiBasketDetail } from "@/lib/api/map";
import { fmtUsd, fmtNum } from "@/lib/format";
import { toUnits } from "@/lib/units";
import { isRealAddress } from "@/lib/web3/addresses";
import { useBasketBalance, usePaused } from "@/lib/web3/hooks";
import { useTrade } from "@/lib/web3/useTrade";
import { useToast } from "../toast/ToastProvider";
import { useWallet } from "../wallet/WalletProvider";

type Tab = "deposit" | "redeem";
const FEE = 0.005;
const MOCK_BALANCE = 86827; // fallback for mock baskets

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span className="muted">{k}</span>
      <span className="num" style={{ fontWeight: 650, color: warn ? "var(--warn)" : "var(--ink)" }}>
        {v}
      </span>
    </div>
  );
}

export function TradePanel({ basket }: { basket: UiBasketDetail }) {
  const { toast } = useToast();
  const { connected, connect } = useWallet();
  const [tab, setTab] = useState<Tab>("deposit");
  const [amt, setAmt] = useState("");

  // Live path when the basket has a real on-chain address; mock simulation otherwise.
  const live = isRealAddress(basket.address);
  const basketAddr = live ? (basket.address as `0x${string}`) : undefined;
  const { balance: liveBalance, refetch: refetchBalance } = useBasketBalance(basketAddr);
  const { state: tradeState, deposit, redeem, reset: resetTrade } = useTrade(
    (basketAddr ?? "0x0000000000000000000000000000000000000000") as `0x${string}`
  );
  const paused = usePaused();

  const myBalance = live ? liveBalance : MOCK_BALANCE;
  const isDep = tab === "deposit";
  const num = parseFloat(amt) || 0;
  // First-depositor edge case: when nav is 0, the contract establishes
  // 1 USDG = 1 basket token, so the deposit estimate is the net USDG itself.
  const est = isDep
    ? basket.nav > 0
      ? (num * (1 - FEE)) / basket.nav
      : num * (1 - FEE)
    : num * basket.nav * (1 - FEE);
  const feeAmt = isDep ? num * FEE : num * basket.nav * FEE;

  const busy = tradeState.phase !== "idle" && tradeState.phase !== "success" && tradeState.phase !== "error";

  // Surface live trade phases as toasts; refresh balance on success. Kept to
  // external-sync effects only (toasts, refetch, machine reset) — the input is
  // cleared at submit time, not here, to avoid setState-in-effect.
  useEffect(() => {
    if (!live) return;
    if (tradeState.phase === "approving") toast("Approve USDG in your wallet…", "pending");
    if (tradeState.phase === "depositing") toast("Confirm the deposit…", "pending");
    if (tradeState.phase === "redeeming") toast("Confirm the redemption…", "pending");
    if (tradeState.phase === "success") {
      toast("Transaction confirmed.", "success");
      refetchBalance();
      resetTrade();
    }
    if (tradeState.phase === "error" && tradeState.error) {
      toast(tradeState.error, "error");
      resetTrade();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeState.phase]);

  function submit() {
    if (!connected) {
      toast("Connect your wallet to continue", "error");
      connect();
      return;
    }
    if (num <= 0) {
      toast("Enter an amount", "error");
      return;
    }
    if (paused) {
      toast("The protocol is temporarily paused. Please try again later.", "error");
      return;
    }

    if (live) {
      if (isDep) deposit(toUnits(amt, 6));
      else redeem(toUnits(amt, 18));
      setAmt("");
      return;
    }

    // Mock simulation (mock-data baskets, no real address).
    if (isDep) toast(`Depositing ${fmtUsd(num)} → approving USDG…`, "pending");
    else toast(`Redeeming ${fmtNum(num, 2)} ${basket.symbol}…`, "pending");
    setTimeout(() => toast("Transaction confirmed", "success"), 1400);
    setAmt("");
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {paused && (
        <div
          style={{
            padding: "10px 16px",
            background: "var(--warn-tint)",
            color: "var(--warn)",
            fontSize: 12.5,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Protocol paused — deposits and redemptions are temporarily disabled.
        </div>
      )}
      <div style={{ display: "flex", padding: 6, gap: 4, background: "var(--surface)" }}>
        {(["deposit", "redeem"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setAmt("");
            }}
            className="btn"
            style={{
              flex: 1,
              height: 40,
              background: tab === k ? "var(--card)" : "transparent",
              color: tab === k ? "var(--ink)" : "var(--muted)",
              boxShadow: tab === k ? "var(--shadow-sm)" : "none",
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="eyebrow">{isDep ? "You pay" : "You redeem"}</span>
          {!isDep && (
            <span className="muted" style={{ fontSize: 12 }}>
              Balance: <span className="num">{fmtNum(myBalance, 2)}</span>
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <input
            className="input"
            style={{
              height: 56,
              fontSize: 22,
              fontFamily: "var(--font-mono)",
              paddingRight: 92,
              fontWeight: 600,
            }}
            placeholder="0.00"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            aria-label={isDep ? "USDG amount to deposit" : "Basket tokens to redeem"}
          />
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {!isDep && (
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => setAmt(String(myBalance))}
              >
                Max
              </button>
            )}
            <span className="tag" style={{ height: 28 }}>
              {isDep ? "USDG" : basket.symbol}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M12 19l-5-5M12 19l5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span className="eyebrow">You receive (est.)</span>
        </div>
        <div
          className="input"
          style={{
            height: 56,
            fontSize: 22,
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            fontWeight: 600,
          }}
        >
          <span style={{ color: est ? "var(--ink)" : "var(--muted-2)" }}>
            {est ? fmtNum(est, 2) : "0.00"}
          </span>
          <span className="tag" style={{ height: 28 }}>
            {isDep ? basket.symbol : "USDG"}
          </span>
        </div>

        <div style={{ marginTop: 16, display: "grid", gap: 8, fontSize: 13 }}>
          <Row k="NAV / token" v={fmtUsd(basket.nav)} />
          <Row k="Management fee (0.50%)" v={fmtUsd(feeAmt)} />
          <Row k="Slippage tolerance" v="0.50%" />
          {isDep && basket.suspended && <Row k="Status" v="Suspended" warn />}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 18 }}
          disabled={(isDep && basket.suspended) || busy || paused}
          onClick={submit}
        >
          {!connected
            ? "Connect wallet"
            : busy
              ? isDep
                ? "Depositing…"
                : "Redeeming…"
              : isDep
                ? "Deposit USDG"
                : `Redeem ${basket.symbol}`}
        </button>
        <p
          className="muted"
          style={{ fontSize: 11.5, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}
        >
          {isDep
            ? "Two steps: approve USDG, then deposit. Priced by Chainlink at execution."
            : "Burns your basket tokens and returns USDG at current NAV."}
        </p>
      </div>
    </div>
  );
}
