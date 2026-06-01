import { Fragment } from "react";

/** Numbered step indicator. Compact "Step X of N" on mobile, full bar on md+. */
export function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <>
      {/* Mobile: compact label */}
      <div className="md:hidden">
        <div className="eyebrow">
          Step {step} of {steps.length}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{steps[step - 1]}</div>
        <div
          style={{
            height: 4,
            background: "var(--surface-2)",
            borderRadius: 4,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(step / steps.length) * 100}%`,
              height: "100%",
              background: "var(--accent)",
              borderRadius: 4,
              transition: "width 0.3s cubic-bezier(0.22,0.7,0.25,1)",
            }}
          />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden items-center md:flex">
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const cur = n === step;
          return (
            <Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    background: done
                      ? "var(--accent)"
                      : cur
                        ? "var(--accent-tint)"
                        : "var(--surface-2)",
                    color: done ? "#fff" : cur ? "var(--accent-strong)" : "var(--muted-2)",
                    border: cur ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                  }}
                >
                  {done ? "✓" : n}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 650,
                    color: cur ? "var(--ink)" : done ? "var(--ink-2)" : "var(--muted-2)",
                  }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: done ? "var(--accent)" : "var(--line)",
                    margin: "0 14px",
                    borderRadius: 2,
                    transition: "background 0.3s",
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
