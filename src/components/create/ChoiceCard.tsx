interface ChoiceCardProps {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}

export function ChoiceCard({ active, onClick, title, desc }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        textAlign: "left",
        padding: 14,
        borderRadius: "var(--r-sm)",
        border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--line)",
        background: active ? "var(--accent-tint)" : "var(--card)",
        cursor: "pointer",
        transition: "border-color 0.12s, background 0.12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 16,
            height: 16,
            flex: "none",
            borderRadius: "50%",
            border: active ? "5px solid var(--accent)" : "2px solid var(--muted-2)",
            transition: "border 0.12s",
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</span>
      </div>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.45 }}>
        {desc}
      </p>
    </button>
  );
}
