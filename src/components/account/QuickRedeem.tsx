"use client";

import { useEffect, useState } from "react";
import type { UiPosition } from "@/lib/api/map";
import { fmtUsd, fmtNum } from "@/lib/format";
import { toUnits } from "@/lib/units";
import { isRealAddress } from "@/lib/web3/addresses";
import { useTrade } from "@/lib/web3/useTrade";
import { Modal } from "../Modal";
import { useToast } from "../toast/ToastProvider";

const FEE = 0.005;

export function QuickRedeem({ p, onClose }: { p: UiPosition; onClose: () => void }) {
  const { toast } = useToast();
  const [amt, setAmt] = useState(String(p.tokens.toFixed(2)));
  const num = parseFloat(amt) || 0;
  const usdc = num * p.nav * (1 - FEE);

  const live = isRealAddress(p.basketAddress);
  const { state, redeem, reset } = useTrade(
    (live ? p.basketAddress : "0x0000000000000000000000000000000000000000") as `0x${string}`
  );
  const busy = state.phase !== "idle" && state.phase !== "success" && state.phase !== "error";

  // Surface live redeem phases; close on success.
  useEffect(() => {
    if (!live) return;
    if (state.phase === "redeeming") toast("Confirm the redemption…", "pending");
    if (state.phase === "success") {
      toast("Redemption confirmed.", "success");
      reset();
      onClose();
    }
    if (state.phase === "error" && state.error) {
      toast(state.error, "error");
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function confirm() {
    if (num <= 0) {
      toast("Enter an amount", "error");
      return;
    }
    if (live) {
      redeem(toUnits(amt, 18));
      return;
    }
    // Mock simulation.
    toast(`Redeeming ${fmtNum(num, 2)} ${p.symbol}…`, "pending");
    setTimeout(() => toast("Redemption confirmed", "success"), 1300);
    onClose();
  }

  return (
    <Modal title={`Redeem ${p.symbol}`} onClose={onClose}>
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
          aria-label={`${p.symbol} amount to redeem`}
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
            {fmtUsd(p.nav)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="muted">Management fee (0.50%)</span>
          <span className="num" style={{ fontWeight: 650 }}>
            {fmtUsd(num * p.nav * FEE)}
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
        disabled={num <= 0 || busy}
        onClick={confirm}
      >
        {busy ? "Redeeming…" : "Confirm redemption"}
      </button>
    </Modal>
  );
}
