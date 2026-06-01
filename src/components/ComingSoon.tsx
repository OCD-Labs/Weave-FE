import Link from "next/link";

/** Placeholder for screens scheduled in later sessions (one screen per session). */
export function ComingSoon({ screen, note }: { screen: string; note?: string }) {
  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="card card-pad" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Coming soon
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{screen}</h1>
        <p className="muted" style={{ marginBottom: 24, fontSize: 15 }}>
          {note ??
            "This screen is part of the Weave build and will be implemented in an upcoming session."}
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
