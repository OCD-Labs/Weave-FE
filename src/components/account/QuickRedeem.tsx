"use client";

import { useState } from "react";
import type { Position } from "@/lib/types";
import { fmtUsd, fmtNum } from "@/lib/format";
import { Modal } from "../Modal";
import { useToast } from "../toast/ToastProvider";

const FEE = 0.005;

export function QuickRedeem({ p, onClose }: { p: Position; onClose: () => void }) {
  const { toast } = useToast();
  const b = p.basket;
  const [amt, setAmt] = useState(String(p.tokens.toFixed(2)));
  const num = parseFloat(amt) || 0;
  const usdc = num * b.nav * (1 - FEE);

  function confirm() {
    toast(`Redeeming ${fmtNum(num, 2)} ${b.symbol}…`, "pending");
    setTimeout(() => toast("Redemption confirmed", "success"), 1300);
    onClose();
  }

  return (
    <Modal title={`Redeem ${b.symbol}`} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="eyebrow">Amount</span>
        <span className="muted" style={{ fontSize: 12 }}>
          Balance <span className="num">{fmtNum(p.tokens, 2)}</span>
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          className="input num"
          style={{ height: 52, fontSize: 20, paddingRight: 70, fontWeight: 600 }}
          value={amt}
          inputMode="decimal"
          onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
          aria-label={`${b.symbol} amount to redeem`}
        />
        <button
          type="button"
          className="btn btn-subtle btn-sm"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}
          onClick={() => setAmt(String(p.tokens.toFixed(2)))}
        >
          Max
        </button>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 18, fontSize: 13.5 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="muted">NAV / token</span>
          <span className="num" style={{ fontWeight: 650 }}>
            {fmtUsd(b.nav)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="muted">Management fee (0.50%)</span>
          <span className="num" style={{ fontWeight: 650 }}>
            {fmtUsd(num * b.nav * FEE)}
          </span>
        </div>
        <hr className="divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>You receive</span>
          <span className="num" style={{ fontSize: 20, fontWeight: 800 }}>
            {fmtUsd(usdc)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 20 }}
        disabled={num <= 0}
        onClick={confirm}
      >
        Confirm redemption
      </button>
    </Modal>
  );
}
