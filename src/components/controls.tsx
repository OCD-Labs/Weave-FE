import { ChevronIcon } from "./icons";

type Option = [value: string, label: string];

/** Segmented control (e.g. All / Auto / Static). */
export function Segmented({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        background: "var(--surface-2)",
        borderRadius: "var(--r-sm)",
        padding: 3,
        gap: 2,
      }}
    >
      {options.map(([k, l]) => {
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(k)}
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: "calc(var(--r-sm) - 2px)",
              fontSize: 13.5,
              fontWeight: 650,
              color: active ? "var(--ink)" : "var(--muted)",
              background: active ? "var(--card)" : "transparent",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/** Styled native <select> with a chevron affordance. */
export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | Option)[];
  label?: string;
}) {
  const opts: Option[] = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  return (
    <label style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {label && <span className="sr-only">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{
          appearance: "none",
          height: 40,
          padding: "0 34px 0 14px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--line)",
          background: "var(--card)",
          color: "var(--ink)",
          fontFamily: "var(--font-ui)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {opts.map(([k, l]) => (
          <option key={k} value={k}>
            {label ? `${label}: ${l}` : l}
          </option>
        ))}
      </select>
      <span
        style={{ position: "absolute", right: 12, pointerEvents: "none", color: "var(--muted-2)" }}
      >
        <ChevronIcon />
      </span>
    </label>
  );
}
