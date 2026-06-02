"use client";

import type { DeployState } from "@/lib/web3/useCreateBasket";
import { explorerTx } from "@/lib/web3/addresses";

type StepState = "pending" | "active" | "done" | "error";

function row(label: string, state: StepState, tx?: string) {
  const dot =
    state === "done"
      ? "var(--up)"
      : state === "active"
        ? "var(--accent)"
        : state === "error"
          ? "var(--down)"
          : "var(--surface-2)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          flex: "none",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: dot,
          color: "#fff",
          fontSize: 12,
          fontWeight: 800,
          animation: state === "active" ? "spin 1.1s linear infinite" : "none",
        }}
      >
        {state === "done" ? "✓" : state === "error" ? "!" : state === "active" ? "◴" : ""}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: state === "pending" ? "var(--muted-2)" : "var(--ink)",
          flex: 1,
        }}
      >
        {label}
      </span>
      {tx && (
        <a
          href={explorerTx(tx)}
          target="_blank"
          rel="noopener noreferrer"
          className="muted"
          style={{ fontSize: 12.5, textDecoration: "underline" }}
        >
          View ↗
        </a>
      )}
    </div>
  );
}

/** Step-by-step deploy tracker: approval → deployment → confirmation. */
export function TransactionStatus({ state }: { state: DeployState }) {
  const { phase } = state;

  const approved = !!state.approved;

  const approval: StepState =
    phase === "approving"
      ? "active"
      : approved
        ? "done"
        : phase === "error"
          ? "error" // failed before/at approval
          : "pending";

  const deployment: StepState =
    !approved
      ? "pending"
      : phase === "deploying" || phase === "confirming"
        ? "active"
        : phase === "success"
          ? "done"
          : phase === "error"
            ? "error" // approved, but the deploy reverted
            : "pending";

  const confirm: StepState =
    phase === "success" ? "done" : phase === "confirming" ? "active" : "pending";

  return (
    <div
      style={{
        marginTop: 18,
        padding: "8px 16px",
        background: "var(--surface)",
        borderRadius: "var(--r-sm)",
      }}
    >
      {row("Approve USDG spend", approval, state.approvalTx)}
      <hr className="divider" />
      {row("Deploy basket", deployment, state.deployTx)}
      <hr className="divider" />
      {row(
        phase === "success" ? "Confirmed — opening your basket" : "Confirm on chain",
        confirm
      )}
      {phase === "error" && state.error && (
        <p className="down" style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
