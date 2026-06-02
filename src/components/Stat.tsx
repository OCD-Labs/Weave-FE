interface StatProps {
  label: string;
  value: string | number;
  sub?: string;
}

/** Compact stat card used in the marketplace hero. */
export function Stat({ label, value, sub }: StatProps) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="eyebrow" style={{ fontSize: 10.5 }}>
        {label}
      </div>
      <div
        className="num"
        style={{ fontSize: 26, fontWeight: 800, marginTop: 6, letterSpacing: "-0.03em" }}
      >
        {value}
      </div>
      {sub && (
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
