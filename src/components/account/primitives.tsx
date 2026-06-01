"use client";

import { useWallet } from "../wallet/WalletProvider";
import { WalletIcon } from "../icons";

/** Full-page wallet-connection prompt for wallet-gated screens. */
export function ConnectGate({ title, sub }: { title: string; sub: string }) {
  const { connect } = useWallet();
  return (
    <div
      className="wrap reveal"
      style={{ paddingTop: 90, paddingBottom: 80, maxWidth: 520, textAlign: "center" }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "var(--accent-tint)",
          display: "grid",
          placeItems: "center",
          margin: "0 auto 20px",
          color: "var(--accent-strong)",
        }}
      >
        <WalletIcon size={28} />
      </div>
      <h1 style={{ fontSize: 26 }}>{title}</h1>
      <p className="muted" style={{ fontSize: 15, marginTop: 10, lineHeight: 1.55 }}>
        {sub}
      </p>
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{ marginTop: 22 }}
        onClick={connect}
      >
        <WalletIcon /> Connect Wallet
      </button>
    </div>
  );
}

export function BigStat({
  label,
  value,
  cls,
  prefix,
}: {
  label: string;
  value: string | number;
  cls?: string;
  prefix?: string;
}) {
  return (
    <div className="card card-pad">
      <div className="eyebrow">{label}</div>
      <div
        className={`num ${cls ?? ""}`}
        style={{ fontSize: 28, fontWeight: 800, marginTop: 8, letterSpacing: "-0.03em" }}
      >
        {prefix ?? ""}
        {value}
      </div>
    </div>
  );
}

export function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>
        {k}
      </div>
      <div className="num" style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>
        {v}
      </div>
    </div>
  );
}
