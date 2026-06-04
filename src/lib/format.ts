/* Formatting helpers. Deterministic (no Intl/locale dependence) so server and
   client render identical strings — avoids React hydration mismatches.
   Mirrors the prototype's fmtUsd / fmtUsdCompact / fmtPct / fmtNum / bps / ago. */

function groupThousands(intStr: string): string {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function withDecimals(n: number, dp: number): string {
  const neg = n < 0;
  const [int, frac = ""] = Math.abs(n).toFixed(dp).split(".");
  const body = dp > 0 ? `${groupThousands(int)}.${frac}` : groupThousands(int);
  return neg ? `-${body}` : body;
}

/** Format a USD amount, e.g. 612.4 → "$612.40". */
export function fmtUsd(n: number, dp = 2): string {
  const s = withDecimals(n, dp);
  return s.startsWith("-") ? `-$${s.slice(1)}` : `$${s}`;
}

/** Compact USD, e.g. 4_820_000 → "$4.82M". */
export function fmtUsdCompact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

/** Signed percentage, e.g. 1.74 → "+1.74%". */
export function fmtPct(n: number, dp = 2): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(dp)}%`;
}

/** Format a plain number with grouping + fixed decimals (token amounts). */
export function fmtNum(n: number, dp = 4): string {
  return withDecimals(n, dp);
}

/** Basis points → percent string, e.g. 3000 → "30%", 3180 → "31.8%". */
export function bps(b: number): string {
  return `${(b / 100).toFixed(b % 100 === 0 ? 0 : 1)}%`;
}

/** Relative time. Uses real wall-clock time so live data tracks the true now;
   only ever called from client components, so Date.now() is hydration-safe. */
export function ago(t: number): string {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

/** Stable pastel chip colors for a sector name (hashed hue). */
export function sectorStyle(sector: string): { background: string; color: string } {
  let h = 0;
  for (let i = 0; i < sector.length; i++) h = (h * 31 + sector.charCodeAt(i)) % 360;
  return { background: `hsl(${h} 62% 95%)`, color: `hsl(${h} 55% 34%)` };
}
