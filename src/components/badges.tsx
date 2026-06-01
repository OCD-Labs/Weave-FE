import { fmtPct, sectorStyle } from "@/lib/format";
import { SpinIcon, ArrowIcon } from "./icons";

/** Auto-Rebalancing / Static badge. */
export function RebalBadge({ on, small }: { on: boolean; small?: boolean }) {
  const style = small ? { height: 22, fontSize: 11.5 } : undefined;
  return on ? (
    <span className="badge badge-accent" style={style}>
      <SpinIcon /> Auto-Rebalancing
    </span>
  ) : (
    <span className="badge badge-neutral" style={style}>
      <span className="dot" style={{ background: "var(--muted-2)" }} /> Static
    </span>
  );
}

/** Signed % change pill, up/down colored. */
export function ChangeBadge({ v, small }: { v: number; small?: boolean }) {
  const up = v >= 0;
  return (
    <span
      className={`badge ${up ? "badge-up" : "badge-down"}`}
      style={small ? { height: 22, fontSize: 11.5 } : undefined}
    >
      <ArrowIcon up={up} /> {fmtPct(v)}
    </span>
  );
}

/** Sector pill with a stable hashed-hue color. */
export function SectorPill({ sector }: { sector: string }) {
  return (
    <span className="sector" style={sectorStyle(sector)}>
      {sector}
    </span>
  );
}
