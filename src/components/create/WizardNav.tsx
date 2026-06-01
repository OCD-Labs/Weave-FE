interface WizardNavProps {
  onBack: () => void;
  onNext?: () => void;
  nextOk?: boolean;
  nextHint?: string;
  hideNext?: boolean;
}

export function WizardNav({ onBack, onNext, nextOk, nextHint, hideNext }: WizardNavProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 22,
        gap: 12,
      }}
    >
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Back
      </button>
      {!hideNext && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!nextOk && nextHint && (
            <span className="muted" style={{ fontSize: 13 }}>
              {nextHint}
            </span>
          )}
          <button type="button" className="btn btn-primary" disabled={!nextOk} onClick={onNext}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
