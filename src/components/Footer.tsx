import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40, background: "var(--card)" }}>
      <div
        className="wrap-wide"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "28px 32px",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandMark size={24} />
          <span style={{ fontWeight: 700 }}>Weave</span>
          <span className="muted" style={{ fontSize: 13 }}>
            · Onchain basket protocol for tokenized equities
          </span>
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          Built on Robinhood Chain · © {new Date().getFullYear()} Weave.
        </div>
      </div>
    </footer>
  );
}
