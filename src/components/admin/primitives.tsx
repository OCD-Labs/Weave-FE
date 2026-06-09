"use client";

import { useState, type ReactNode } from "react";

/** A titled governance section card. */
export function AdminSection({
  title,
  desc,
  danger,
  right,
  children,
}: {
  title: string;
  desc?: string;
  danger?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="card card-pad"
      style={danger ? { borderColor: "var(--down)", background: "var(--down-tint)" } : undefined}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          {desc && (
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, maxWidth: 620 }}>
              {desc}
            </p>
          )}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 18, display: "grid", gap: 14 }}>{children}</div>
    </section>
  );
}

/** A single editable parameter: label, current value, input and a save button.
   Holds its own draft so the parent does not manage one useState per field. */
export function ParamField({
  label,
  hint,
  current,
  placeholder,
  cta = "Save",
  busy,
  disabled,
  multi,
  onSubmit,
}: {
  label: string;
  hint?: string;
  current?: string;
  placeholder?: string;
  cta?: string;
  busy?: boolean;
  disabled?: boolean;
  /** Render a wider input (addresses, lists). */
  multi?: boolean;
  onSubmit: (raw: string) => void;
}) {
  const [v, setV] = useState("");
  const submit = () => {
    if (v.trim()) onSubmit(v.trim());
  };
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <label className="eyebrow" style={{ fontSize: 10.5 }}>
          {label}
        </label>
        {current !== undefined && (
          <span className="muted" style={{ fontSize: 12 }}>
            Current: <span className="mono">{current}</span>
          </span>
        )}
      </div>
      {hint && (
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
          {hint}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 0, fontFamily: multi ? "var(--font-mono)" : undefined, fontSize: multi ? 13 : undefined }}
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: "none" }}
          disabled={busy || disabled || !v.trim()}
          onClick={submit}
        >
          {busy ? "…" : cta}
        </button>
      </div>
    </div>
  );
}

/** A standalone governance action (no input), e.g. pause / accept. */
export function ActionButton({
  label,
  busy,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
      style={danger ? { background: "var(--down)", color: "#fff" } : undefined}
      disabled={busy || disabled}
      onClick={onClick}
    >
      {busy ? "…" : label}
    </button>
  );
}
