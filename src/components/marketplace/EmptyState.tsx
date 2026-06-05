import Link from "next/link";

export function EmptyState() {
  return (
    <div className="card card-pad" style={{ textAlign: "center", padding: "64px 24px", marginTop: 8 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>No baskets match those filters</div>
      <p className="muted" style={{ marginTop: 8 }}>
        Try widening your search — or compose the thesis yourself.
      </p>
      <Link href="/create" className="btn btn-primary" style={{ marginTop: 18 }}>
        Create a basket
      </Link>
    </div>
  );
}
