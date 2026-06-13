import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div
      className="wrap reveal"
      style={{
        minHeight: "62vh",
        display: "grid",
        placeItems: "center",
        paddingTop: 80,
        paddingBottom: 80,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <div
          className="num transform rotate-12 "
          style={{
            fontSize: 136,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginTop: 18,
            color: "var(--accent-strong)",
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: 24, marginTop: 20 }}>This page came unwoven</h1>
        <p className="muted" style={{ fontSize: 15, marginTop: 10, lineHeight: 1.55 }}>
          The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
          back to something investable.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 26,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" className="btn btn-ghost btn-lg">
            Back home
          </Link>
          <Link href="/markets" className="btn btn-primary btn-lg">
            Browse baskets
          </Link>
        </div>
      </div>
    </div>
  );
}
