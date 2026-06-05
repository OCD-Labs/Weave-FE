"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBaskets } from "@/lib/api/hooks";
import { mapBasketSummary } from "@/lib/api/map";
import type { Constituent, NavPoint } from "@/lib/types";
import { fmtUsd, fmtUsdCompact } from "@/lib/format";
import {
  SparkleIcon,
  SpinIcon,
  GridIcon,
  ChainIcon,
  CoinIcon,
  BalanceIcon,
  ShieldIcon,
  CheckIcon,
} from "../icons";
import { RebalBadge, ChangeBadge, SectorPill } from "../badges";
import { NavChart } from "../charts/NavChart";
import { DonutChart } from "../charts/DonutChart";
import { LiveBasketCard } from "../marketplace/LiveBasketCard";

const HOW_IT_WORKS = [
  {
    n: "01",
    t: "Describe your thesis",
    d: 'Write what you believe in, like "European defense primes" or "AI power infrastructure outside the US." Plain language is enough.',
    icon: <SparkleIcon />,
  },
  {
    n: "02",
    t: "AI composes the index",
    d: "The agent reads the full catalogue, picks constituents, sets weights, and writes a rationale for every holding. You adjust anything.",
    icon: <GridIcon />,
  },
  {
    n: "03",
    t: "Publish onchain",
    d: "Deploy as a single ERC-20. Investors deposit USDG and receive your index token, priced live by Chainlink.",
    icon: <ChainIcon />,
  },
  {
    n: "04",
    t: "Earn continuously",
    d: "Collect 80% of the 0.50% management fee for the life of the index, via ERC-7641 revenue sharing.",
    icon: <CoinIcon />,
  },
];

const AI_CHECKS = [
  "Constituent selection with per-stock rationale",
  "Auto-balanced weights that sum to 100%",
  "Built-in risk notes and concentration caps",
  "Fully editable, so you can keep, drop, or reweight any holding",
];

const TRUST_SECTORS = ["Technology", "Consumer Discretionary", "Communication Services"];

export function Landing() {
  const { data } = useBaskets();
  const baskets = useMemo(() => (data ?? []).map(mapBasketSummary), [data]);
  const totalAum = useMemo(() => baskets.reduce((s, b) => s + b.aum, 0), [baskets]);
  const featured = useMemo(
    () => [...baskets].sort((a, b) => b.aum - a.aum).slice(0, 3),
    [baskets]
  );

  return (
    <div className="reveal">
      {/* ============ HERO ============ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <WeaveBackdrop />
        <div className="wrap-wide land-hero">
          <div className="land-hero-copy">
            <span className="badge badge-accent" style={{ marginBottom: 20 }}>
              <SpinIcon /> Onchain index protocol · Built on Robinhood Chain
            </span>
            <h1 className="land-h1">
              Turn any investment thesis into{" "}
              <span style={{ color: "var(--accent-strong)" }}>one investable token.</span>
            </h1>
            <p className="land-sub">
              Weave lets anyone compose a thematic index of tokenized stocks, publish it onchain in
              minutes, and earn a perpetual share of its revenue. No fund, no paperwork, no
              minimums.
            </p>
            <div className="land-cta">
              <Link href="/create" className="btn btn-primary btn-lg">
                <SparkleIcon /> Compose an index
              </Link>
              <Link href="/markets" className="btn btn-ghost btn-lg">
                Explore the market
              </Link>
            </div>
            <div className="land-hero-stats">
              <div>
                <div className="num land-stat-n">{fmtUsdCompact(totalAum)}</div>
                <div className="land-stat-l">Total value woven</div>
              </div>
              <div className="land-stat-div" />
              <div>
                <div className="num land-stat-n">{baskets.length}</div>
                <div className="land-stat-l">Live indexes</div>
              </div>
              <div className="land-stat-div" />
              <div>
                <div className="num land-stat-n">0.50%</div>
                <div className="land-stat-l">Flat management fee</div>
              </div>
            </div>
          </div>
          <div className="land-hero-art">
            <HeroIndexCard />
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <div className="wrap-wide">
        <div className="land-trust">
          <span className="land-trust-label">Composed from real tokenized stocks across</span>
          <div className="land-trust-sectors">
            {TRUST_SECTORS.map((s) => (
              <SectorPill key={s} sector={s} />
            ))}
          </div>
        </div>
      </div>

      {/* ============ HOW IT WORKS ============ */}
      <section className="wrap-wide land-section">
        <SectionHead eyebrow="How it works" title="From conviction to token in four steps" />
        <div className="land-steps">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="card card-pad land-step">
              <div className="land-step-top">
                <span className="land-step-icon">{s.icon}</span>
                <span className="num land-step-num">{s.n}</span>
              </div>
              <h3 style={{ fontSize: 18, marginTop: 16 }}>{s.t}</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ AI ENGINE FEATURE ============ */}
      <section className="land-feature-band">
        <div className="wrap-wide land-feature">
          <div>
            <span className="badge badge-accent" style={{ marginBottom: 16 }}>
              <SparkleIcon /> AI composition engine
            </span>
            <h2 className="land-h2">Describe it. The agent builds it.</h2>
            <p
              className="muted"
              style={{ fontSize: 16, marginTop: 14, lineHeight: 1.6, maxWidth: 480 }}
            >
              Weave&apos;s engine reads the entire Robinhood Chain catalogue, including sectors,
              market caps, and live prices, then proposes a complete, weighted index with a reasoned
              case for every pick. Concentration limits and weight rules are enforced before you ever
              deploy.
            </p>
            <ul className="land-checks">
              {AI_CHECKS.map((c) => (
                <li key={c}>
                  <CheckIcon /> {c}
                </li>
              ))}
            </ul>
            <Link href="/create" className="btn btn-primary btn-lg" style={{ marginTop: 26 }}>
              <SparkleIcon /> Try the composer
            </Link>
          </div>
          <div>
            <AIPromptMock />
          </div>
        </div>
      </section>

      {/* ============ FEATURED INDEXES ============ */}
      {featured.length > 0 && (
        <section className="wrap-wide land-section">
          <div className="land-section-head-row">
            <SectionHead eyebrow="Live on Weave" title="Indexes people are investing in" noMargin />
            <Link href="/markets" className="btn btn-ghost">
              View all markets →
            </Link>
          </div>
          <div className="land-featured">
            {featured.map((b) => (
              <LiveBasketCard key={b.address} basket={b} />
            ))}
          </div>
        </section>
      )}

      {/* ============ PILLARS ============ */}
      <section className="wrap-wide land-section">
        <SectionHead eyebrow="Why Weave" title="A fund-grade product, without the fund" />
        <div className="land-pillars">
          <Pillar
            icon={<CoinIcon />}
            title="A real creator economy"
            desc="Publishing an index mints a transferable creator token (ERC-7641) that streams you 80% of all fees. Your thesis becomes a durable, sellable asset."
          >
            <div className="land-pillar-stat">
              <span className="num">80%</span>
              <span className="muted">of fees to creators</span>
            </div>
          </Pillar>
          <Pillar
            icon={<BalanceIcon />}
            title="Rebalancing is your choice"
            desc="Let winners run with a static index, or enable auto-rebalancing with a drift threshold, restored automatically via Chainlink Automation and funded from fees."
          >
            <div className="land-rebal-demo">
              <RebalBadge on={true} small />
              <RebalBadge on={false} small />
            </div>
          </Pillar>
          <Pillar
            icon={<ShieldIcon />}
            title="Transparent and onchain"
            desc="Every holding, weight, deposit, and rebalance is visible onchain. NAV is priced live by Chainlink. Redeem to USDG at any time at fair value."
          >
            <div className="land-pillar-stat">
              <span className="num">0.50%</span>
              <span className="muted">flat management fee</span>
            </div>
          </Pillar>
        </div>
      </section>

      {/* ============ CREATOR CTA ============ */}
      <section className="wrap-wide land-section">
        <div className="land-creator card">
          <WeaveBackdrop subtle />
          <div className="land-creator-inner">
            <div style={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
              <span className="eyebrow" style={{ color: "var(--on-accent)", opacity: 0.8 }}>
                For creators
              </span>
              <h2
                style={{
                  fontSize: 34,
                  color: "var(--on-accent)",
                  marginTop: 12,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Your research, finally an asset that pays you.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "var(--on-accent)",
                  opacity: 0.9,
                  marginTop: 14,
                  lineHeight: 1.6,
                }}
              >
                Stop giving away your best ideas in threads. Package your thesis once and earn from
                every dollar that follows it, for as long as it&apos;s held.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                <Link
                  href="/create"
                  className="btn btn-lg hover:!border !border-teal-900 transition-all duration-100"
                  style={{ background: "var(--on-accent)", color: "var(--accent-strong)" }}
                >
                  Create your first index
                </Link>
                <Link
                  href="/creator"
                  className="btn btn-lg hover:!bg-[rgba(2,194,162,0.41)] transition-all duration-100"
                  style={{ background: "rgba(255,255,255,0.14)", color: "var(--on-accent)" }}
                >
                  See creator dashboard
                </Link>
              </div>
            </div>
            <div className="land-creator-art">
              <div className="card land-earn-card">
                <div className="eyebrow" style={{ color: "var(--accent-strong)" }}>
                  Claimable revenue
                </div>
                <div
                  className="num"
                  style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 6 }}
                >
                  $48,210
                </div>
                <div className="land-earn-bars">
                  {[5, 4, 6, 7, 6, 8, 9, 8, 11, 12, 14].map((v, i, a) => (
                    <div
                      key={i}
                      style={{
                        height: `${(v / 14) * 100}%`,
                        background:
                          i === a.length - 1 ? "var(--accent)" : "var(--accent-tint-2)",
                      }}
                    />
                  ))}
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                  Accruing every block · ERC-7641
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---- woven lattice backdrop ---- */
function WeaveBackdrop({ subtle }: { subtle?: boolean }) {
  return (
    <svg
      className={`land-backdrop${subtle ? " subtle" : ""}`}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        {Array.from({ length: 9 }).map((_, r) => {
          const y = 40 + r * 70;
          return (
            <path
              key={r}
              d={`M-20 ${y} C 130 ${y - 40}, 250 ${y + 40}, 400 ${y} S 670 ${y - 40}, 820 ${y} S 1090 ${y + 40}, 1240 ${y}`}
              opacity={0.5 - r * 0.03}
            />
          );
        })}
      </g>
    </svg>
  );
}

/* ---- hero product card (static design showcase, not live data) ---- */
const HERO_DEMO = {
  name: "AI Infrastructure",
  symbol: "AIIB",
  nav: 1.74,
  navChg24: 2.91,
  feePerDay: 124.93,
  constituents: ["TSM", "ASML", "VRT", "ABBNd", "ETN"],
  slices: [
    { sym: "TSM", w: 2500 },
    { sym: "ASML", w: 2000 },
    { sym: "VRT", w: 2000 },
    { sym: "ABBNd", w: 1800 },
    { sym: "ETN", w: 1700 },
  ],
};

// Synthesized, deterministic upward NAV curve for the showcase chart.
const HERO_HISTORY: NavPoint[] = Array.from({ length: 30 }, (_, i) => ({
  t: i,
  nav: 1.42 * (1 + 0.0085 * i + 0.012 * Math.sin(i * 1.3)),
}));

function HeroIndexCard() {
  const slices: Constituent[] = HERO_DEMO.slices.map((s) => ({
    sym: s.sym,
    target: s.w,
    current: s.w,
    name: s.sym,
    sector: "",
    price: 0,
    chg: 0,
  }));

  return (
    <div className="land-art-stack">
      <div className="card land-art-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 18 }}>{HERO_DEMO.name}</h3>
              <span className="tag">{HERO_DEMO.symbol}</span>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>
              by kosmos.eth
            </div>
          </div>
          <RebalBadge on={true} small />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          <div>
            <div className="eyebrow" style={{ fontSize: 9.5 }}>
              NAV / token
            </div>
            <div
              className="num"
              style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}
            >
              {fmtUsd(HERO_DEMO.nav)}
            </div>
          </div>
          <ChangeBadge v={HERO_DEMO.navChg24} />
        </div>
        <div
          style={{ marginTop: 14, borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}
        >
          <NavChart data={HERO_HISTORY} range="all" height={120} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {HERO_DEMO.constituents.map((sym) => (
            <span key={sym} className="tag" style={{ fontSize: 11 }}>
              {sym}
            </span>
          ))}
        </div>
      </div>

      <div className="card land-art-chip land-art-chip-1">
        <DonutChart slices={slices} size={99} thickness={14} />
      </div>
      <div className="card land-art-chip land-art-chip-2">
        <span className="land-chip-icon">
          <CoinIcon />
        </span>
        <div>
          <div className="num" style={{ fontWeight: 800, fontSize: 16 }}>
            +{fmtUsd(HERO_DEMO.feePerDay)}
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            creator fees / day
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- AI prompt mock ---- */
function AIPromptMock() {
  const rows: [string, string, number][] = [
    ["AMD", "Advanced Micro Devices", 30],
    ["AMZN", "Amazon.com", 25],
    ["NFLX", "Netflix", 20],
    ["PLTR", "Palantir", 15],
    ["TSLA", "Tesla", 10],
  ];
  return (
    <div className="card land-ai-mock">
      <div className="land-ai-prompt">
        <span className="land-ai-label">Your thesis</span>
        <p>
          The backbone of AI built on US tech, including compute, cloud, data analytics, and the
          chips that power it.
        </p>
      </div>
      <div className="land-ai-arrow">
        <SparkleIcon /> Composing…
      </div>
      <div className="land-ai-rows">
        {rows.map(([sym, name, w], i) => (
          <div key={sym} className="land-ai-row" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="tag">{sym}</span>
            <span className="land-ai-name">{name}</span>
            <div className="land-ai-bar">
              <div style={{ width: `${w * 3}%` }} />
            </div>
            <span className="num land-ai-w">{w}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- bits ---- */
function SectionHead({
  eyebrow,
  title,
  noMargin,
}: {
  eyebrow: string;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 36, maxWidth: 640 }}>
      <span className="eyebrow" style={{ color: "var(--accent-strong)" }}>
        {eyebrow}
      </span>
      <h2 className="land-h2" style={{ marginTop: 10 }}>
        {title}
      </h2>
    </div>
  );
}

function Pillar({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card card-pad land-pillar">
      <span className="land-pillar-icon">{icon}</span>
      <h3 style={{ fontSize: 19, marginTop: 16 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
        {desc}
      </p>
      <div style={{ marginTop: "auto", paddingTop: 18 }}>{children}</div>
    </div>
  );
}
