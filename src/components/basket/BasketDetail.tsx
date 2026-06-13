"use client";

import { useState } from "react";
import Link from "next/link";
import type { UiBasketDetail } from "@/lib/api/map";
import { fmtUsd, fmtUsdCompact, fmtPct, fmtNum, bps, ago } from "@/lib/format";
import { explorerTx } from "@/lib/web3/addresses";
import { Segmented } from "../controls";
import { RebalBadge, ChangeBadge, SectorPill } from "../badges";
import { SpinIcon, CopyIcon, CheckIcon } from "../icons";
import { NavChart } from "../charts/NavChart";
import { DonutChart } from "../charts/DonutChart";
import { DriftIndicator } from "./DriftIndicator";
import { TradePanel } from "./TradePanel";

type Range = "24h" | "7d" | "30d" | "all";
type ActTab = "deposits" | "redemptions" | "rebalances";

const RANGES: [Range, string][] = [
  ["24h", "24H"],
  ["7d", "7D"],
  ["30d", "30D"],
  ["all", "All"],
];

// Shorten a real 0x hash/address (40 or 64 hex chars); pass through anything
// else (e.g. a mock ENS name like "thesis.eth").
function shortLabel(s: string): string {
  return /^0x[0-9a-fA-F]{40,64}$/.test(s) ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}
const creatorLabel = shortLabel;

/** Inline address with a copy button that flips to a check for ~1.4s. */
function CopyField({
  label,
  value,
  display,
  accent,
}: {
  label: string;
  value: string;
  display: string;
  accent?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {label}{" "}
      <span
        className="mono"
        style={{ color: accent ? "var(--accent-strong)" : "var(--ink-2)", fontWeight: 600 }}
      >
        {display}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        title={copied ? "Copied" : "Copy"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          lineHeight: 0,
          padding: 2,
          color: copied ? "var(--accent-strong)" : "var(--muted-2)",
          cursor: "pointer",
        }}
      >
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
    </span>
  );
}

function MiniStat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
      <div className="eyebrow" style={{ fontSize: 9.5 }}>
        {label}
      </div>
      <div className={`num ${cls ?? ""}`} style={{ fontSize: 16, fontWeight: 750, marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}

export function BasketDetail({ basket }: { basket: UiBasketDetail }) {
  const [range, setRange] = useState<Range>("30d");
  const [hoverSlice, setHoverSlice] = useState<number | null>(null);
  const [actTab, setActTab] = useState<ActTab>("deposits");

  if (!basket) return (
    <div className="wrap-wide" style={{ paddingTop: 28, paddingBottom: 64 }}>
      <div className="skel" style={{ height: 14, width: 160, marginBottom: 20 }}></div>
      <div className="skel" style={{ height: 34, width: 320, marginBottom: 12 }}></div>
      <div className="skel" style={{ height: 16, width: "60%", marginBottom: 28 }}></div>
    </div>
  );

  const up = basket.navChg24 >= 0;

  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 28, paddingBottom: 64 }}>
      {/* Breadcrumb */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13 }}
      >
        <Link href="/markets" className="muted" style={{ fontWeight: 600 }}>
          Markets
        </Link>
        <span className="muted">/</span>
        <span style={{ fontWeight: 600 }}>{basket.name}</span>
      </div>

      {basket.suspended && (
        <div
          className="card"
          style={{
            borderColor: "var(--warn)",
            background: "var(--warn-tint)",
            padding: "12px 16px",
            marginBottom: 18,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span className="badge badge-warn">Suspended</span>
          <span style={{ fontSize: 14 }}>
            This basket is suspended and cannot currently accept deposits.
          </span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 26,
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 32 }}>{basket.name}</h1>
            <span className="tag" style={{ height: 26 }}>
              {basket.symbol}
            </span>
            <RebalBadge on={basket.rebalancing} />
          </div>
          <p className="muted" style={{ fontSize: 15, marginTop: 12, lineHeight: 1.55 }}>
            {basket.thesis}
          </p>
          <div style={{ display: "flex", gap: 18, marginTop: 14, fontSize: 13, flexWrap: "wrap" }}>
            <CopyField
              label="Basket address"
              value={basket.address}
              display={shortLabel(basket.address)}
            />
            <CopyField
              label="Created by"
              value={basket.creator}
              display={creatorLabel(basket.creator)}
              accent
            />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="eyebrow">NAV / token</div>
          <div
            className="num"
            style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            {fmtUsd(basket.nav)}
          </div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
            <ChangeBadge v={basket.navChg24} />
          </div>
        </div>
      </div>

      {/* Two-column layout: stacks under lg */}
      <div className="grid grid-cols-1 items-start gap-[var(--gap)] lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        {/* LEFT column */}
        <div className="grid gap-[var(--gap)]">
          {/* NAV chart */}
          <div className="card card-pad">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div className="eyebrow">Net asset value</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                  <span className="num" style={{ fontSize: 24, fontWeight: 800 }}>
                    {fmtUsd(basket.nav)}
                  </span>
                  <span
                    className={`num ${basket.navChg30 >= 0 ? "up" : "down"}`}
                    style={{ fontSize: 14, fontWeight: 700 }}
                  >
                    {fmtPct(basket.navChg30)} · 30d
                  </span>
                </div>
              </div>
              <Segmented
                value={range}
                onChange={(v) => setRange(v as Range)}
                options={RANGES}
                ariaLabel="Chart range"
              />
            </div>
            <NavChart data={basket.history} range={range} height={280} />
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniStat label="AUM" value={fmtUsdCompact(basket.aum)} />
              <MiniStat label="24h" value={fmtPct(basket.navChg24)} cls={up ? "up" : "down"} />
              <MiniStat
                label="7d"
                value={fmtPct(basket.navChg7)}
                cls={basket.navChg7 >= 0 ? "up" : "down"}
              />
              <MiniStat
                label="30d"
                value={fmtPct(basket.navChg30)}
                cls={basket.navChg30 >= 0 ? "up" : "down"}
              />
            </div>
          </div>

          {/* Drift indicator */}
          {basket.rebalancing && <DriftIndicator basket={basket} />}

          {/* Composition */}
          <div className="card card-pad">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 17 }}>Composition</h3>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Current weight vs. target
              </span>
            </div>
            <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
              <DonutChart
                slices={basket.constituents}
                size={184}
                active={hoverSlice}
                onHover={setHoverSlice}
              />
              <div style={{ flex: 1, minWidth: 240 }}>
                {basket.constituents.map((c, i) => {
                  const drift = c.current - c.target;
                  const last = i === basket.constituents.length - 1;
                  return (
                    <div
                      key={c.sym}
                      onMouseEnter={() => setHoverSlice(i)}
                      onMouseLeave={() => setHoverSlice(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 0",
                        borderBottom: last ? "none" : "1px solid var(--line-2)",
                        opacity: hoverSlice == null || hoverSlice === i ? 1 : 0.4,
                        transition: "opacity 0.12s",
                      }}
                    >
                      <span className="tag" style={{ minWidth: 56, justifyContent: "center" }}>
                        {c.sym}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            height: 6,
                            background: "var(--surface-2)",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${c.current / 100}%`,
                              height: "100%",
                              background: "var(--accent)",
                              borderRadius: 4,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="num"
                        style={{ fontSize: 13, fontWeight: 700, minWidth: 46, textAlign: "right" }}
                      >
                        {bps(c.current)}
                      </span>
                      <span
                        className="num"
                        style={{
                          fontSize: 11.5,
                          minWidth: 52,
                          textAlign: "right",
                          color: Math.abs(drift) > 200 ? "var(--warn)" : "var(--muted-2)",
                        }}
                      >
                        {drift >= 0 ? "+" : ""}
                        {(drift / 100).toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Holdings table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: 17 }}>Holdings</h3>
            </div>
            <div className="scroll-x">
              <table className="tbl tbl-hover">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Sector</th>
                    <th style={{ textAlign: "right" }}>Target</th>
                    <th style={{ textAlign: "right" }}>Current</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                    <th style={{ textAlign: "right" }}>24h</th>
                  </tr>
                </thead>
                <tbody>
                  {basket.constituents.map((c) => {
                    const drift = Math.abs(c.current - c.target);
                    const hot =
                      basket.rebalancing && !!basket.driftBps && drift > basket.driftBps * 0.5;
                    return (
                      <tr key={c.sym}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span className="tag">{c.sym}</span>
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                          </div>
                        </td>
                        <td>
                          <SectorPill sector={c.sector} />
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {bps(c.target)}
                        </td>
                        <td
                          className="num"
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: hot ? "var(--warn)" : "var(--ink)",
                          }}
                        >
                          {bps(c.current)}
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {fmtUsd(c.price)}
                        </td>
                        <td
                          className={`num ${c.chg >= 0 ? "up" : "down"}`}
                          style={{ textAlign: "right" }}
                        >
                          {fmtPct(c.chg)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 4, padding: "14px 20px 0" }}>
              {(
                [
                  ["deposits", "Deposits"],
                  ["redemptions", "Redemptions"],
                  ["rebalances", "Rebalances"],
                ] as [ActTab, string][]
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActTab(k)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px 8px 0 0",
                    fontSize: 14,
                    fontWeight: 650,
                    color: actTab === k ? "var(--ink)" : "var(--muted)",
                    borderBottom: actTab === k ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <hr className="divider" />
            <div className="scroll-x">
              {actTab === "deposits" ? (
                <table className="tbl tbl-hover">
                  <thead>
                    <tr>
                      <th>Investor</th>
                      <th style={{ textAlign: "right" }}>USDG</th>
                      <th style={{ textAlign: "right" }}>Tokens minted</th>
                      <th style={{ textAlign: "right" }}>When</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {basket.deposits.length ? basket.deposits.map((d, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: 13 }}>
                          {shortLabel(d.investor)}
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {fmtUsd(d.usdg)}
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {fmtNum(d.tokens, 2)}
                        </td>
                        <td className="muted" style={{ textAlign: "right", fontSize: 13 }}>
                          {ago(d.t)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {d.txHash ? (
                            <a
                              href={explorerTx(d.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="muted"
                              title="View on explorer"
                              style={{ textDecoration: "none" }}
                            >
                              ↗
                            </a>
                          ) : (
                            <span className="muted" style={{ opacity: 0.4 }}>
                              ↗
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="muted" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>
                            No deposits yet.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : actTab === "redemptions" ? (
                <table className="tbl tbl-hover">
                  <thead>
                    <tr>
                      <th>Investor</th>
                      <th style={{ textAlign: "right" }}>USDG returned</th>
                      <th style={{ textAlign: "right" }}>Tokens burned</th>
                      <th style={{ textAlign: "right" }}>When</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {basket.redemptions.length ? basket.redemptions.map((r, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: 13 }}>
                          {shortLabel(r.investor)}
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {fmtUsd(r.usdg)}
                        </td>
                        <td className="num" style={{ textAlign: "right" }}>
                          {fmtNum(r.tokens, 2)}
                        </td>
                        <td className="muted" style={{ textAlign: "right", fontSize: 13 }}>
                          {ago(r.t)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {r.txHash ? (
                            <a
                              href={explorerTx(r.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="muted"
                              title="View on explorer"
                              style={{ textDecoration: "none" }}
                            >
                              ↗
                            </a>
                          ) : (
                            <span className="muted" style={{ opacity: 0.4 }}>↗</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="muted" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>
                            No redemptions yet.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : basket.rebalances.length ? (
                <table className="tbl tbl-hover">
                  <thead>
                    <tr>
                      <th>Triggered by</th>
                      <th>Tx</th>
                      <th style={{ textAlign: "right" }}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basket.rebalances.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>
                          <span className="badge badge-accent">
                            <SpinIcon /> {shortLabel(r.by)}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: 13 }}>
                          {r.tx ? (
                            <a
                              href={explorerTx(r.tx)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--accent-strong)", textDecoration: "none" }}
                            >
                              {shortLabel(r.tx)} ↗
                            </a>
                          ) : (
                            shortLabel(r.tx)
                          )}
                        </td>
                        <td className="muted" style={{ textAlign: "right", fontSize: 13 }}>
                          {ago(r.t)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="muted" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>
                  No rebalances yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT column — sticky trade panel on desktop */}
        <div className="lg:sticky lg:top-20">
          <TradePanel basket={basket} />
        </div>
      </div>
    </div>
  );
}
