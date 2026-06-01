"use client";

import { useState } from "react";
import type { Basket } from "@/lib/types";
import { fmtUsd, fmtNum } from "@/lib/format";
import { useToast } from "../toast/ToastProvider";
import { useWallet } from "../wallet/WalletProvider";

type Tab = "deposit" | "redeem";
const FEE = 0.005;
const MY_BALANCE = 86827; // mock contract balanceOf

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

export function TradePanel({ basket }: { basket: Basket }) {
  const { toast } = useToast();
  const { connected, connect } = useWallet();
  const [tab, setTab] = useState<Tab>("deposit");
  const [amt, setAmt] = useState("");

  const isDep = tab === "deposit";
  const num = parseFloat(amt) || 0;
  const est = isDep ? (num * (1 - FEE)) / basket.nav : num * basket.nav * (1 - FEE);
  const feeAmt = isDep ? num * FEE : num * basket.nav * FEE;

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
    if (isDep) toast(`Depositing ${fmtUsd(num)} → approving USDC…`, "pending");
    else toast(`Redeeming ${fmtNum(num, 2)} ${basket.symbol}…`, "pending");
    setTimeout(() => toast("Transaction confirmed", "success"), 1400);
    setAmt("");
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
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
              Balance: <span className="num">{fmtNum(MY_BALANCE, 2)}</span>
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
            aria-label={isDep ? "USDC amount to deposit" : "Basket tokens to redeem"}
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
                onClick={() => setAmt(String(MY_BALANCE))}
              >
                Max
              </button>
            )}
            <span className="tag" style={{ height: 28 }}>
              {isDep ? "USDC" : basket.symbol}
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
            {isDep ? basket.symbol : "USDC"}
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
          disabled={isDep && basket.suspended}
          onClick={submit}
        >
          {!connected ? "Connect wallet" : isDep ? "Deposit USDC" : `Redeem ${basket.symbol}`}
        </button>
        <p
          className="muted"
          style={{ fontSize: 11.5, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}
        >
          {isDep
            ? "Two steps: approve USDC, then deposit. Priced by Chainlink at execution."
            : "Burns your basket tokens and returns USDC at current NAV."}
        </p>
      </div>
    </div>
  );
}
