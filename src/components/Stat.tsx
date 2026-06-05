interface StatProps {
  label: string;
  value: string | number;
  sub?: string;
  /** Larger variant for the marketplace hero band. */
  big?: boolean;
}

/** Compact stat card used in the marketplace hero. */
export function Stat({ label, value, sub, big }: StatProps) {
  return (
    <div className="card" style={{ padding: big ? "22px 24px" : 18 }}>
      <div className="eyebrow" style={{ fontSize: big ? 11 : 10.5 }}>
        {label}
      </div>
      <div
        className="num"
        style={{
          fontSize: big ? 34 : 26,
          fontWeight: 800,
          marginTop: big ? 8 : 6,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="muted" style={{ fontSize: big ? 13 : 12, marginTop: big ? 4 : 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
