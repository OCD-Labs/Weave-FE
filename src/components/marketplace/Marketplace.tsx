"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Basket } from "@/lib/types";
import { fmtUsdCompact } from "@/lib/format";
import { SpinIcon, SearchIcon } from "../icons";
import { Stat } from "../Stat";
import { Segmented, Select } from "../controls";
import { BasketCard } from "./BasketCard";
import { EmptyState } from "./EmptyState";

type Rebal = "all" | "auto" | "static";
type Sort = "aum" | "return" | "new";

interface MarketplaceProps {
  baskets: Basket[];
  sectors: string[];
  totalAum: number;
}

export function Marketplace({ baskets, sectors, totalAum }: MarketplaceProps) {
  const [sector, setSector] = useState("All");
  const [rebal, setRebal] = useState<Rebal>("all");
  const [sort, setSort] = useState<Sort>("aum");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = baskets.filter((b) => {
      if (sector !== "All" && !b.constituents.some((c) => c.sector === sector)) return false;
      if (rebal === "auto" && !b.rebalancing) return false;
      if (rebal === "static" && b.rebalancing) return false;
      if (
        query &&
        !(b.name.toLowerCase().includes(query) || b.thesis.toLowerCase().includes(query))
      )
        return false;
      return true;
    });
    return [...filtered].sort((a, b) =>
      sort === "aum"
        ? b.aum - a.aum
        : sort === "return"
          ? b.navChg24 - a.navChg24
          : b.createdAt - a.createdAt
    );
  }, [baskets, sector, rebal, sort, q]);

  return (
    <div className="reveal">
      {/* Hero */}
      <div className="wrap-wide" style={{ paddingTop: 52, paddingBottom: 36 }}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div style={{ maxWidth: 640 }}>
            <span className="badge badge-accent" style={{ marginBottom: 16 }}>
              <SpinIcon /> Onchain index protocol
            </span>
            <h1 className="text-[34px] leading-[1.05] sm:text-[46px] sm:leading-[1.04]" style={{ letterSpacing: "-0.035em" }}>
              Any investment thesis,
              <br />
              as one investable token.
            </h1>
            <p className="muted" style={{ fontSize: 17, marginTop: 16, lineHeight: 1.55, maxWidth: 560 }}>
              Compose a thematic basket of tokenized equities, publish it onchain, and earn a
              continuous share of its revenue for as long as investors hold it.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
              <Link href="/create" className="btn btn-primary btn-lg">
                Create a basket
              </Link>
              <a href="#mkt-list" className="btn btn-ghost btn-lg">
                Browse markets
              </a>
            </div>
          </div>
          <div
            className="grid grid-cols-2 gap-3.5"
            style={{ minWidth: 280 }}
          >
            <Stat label="Total value woven" value={fmtUsdCompact(totalAum)} />
            <Stat label="Live baskets" value={baskets.length} />
            <Stat label="Tokenized equities" value="1,983" />
            <Stat label="Protocol fee" value="0.50%" sub="80% to creators" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div
        id="mkt-list"
        className="wrap-wide"
        style={{
          position: "sticky",
          top: 64,
          zIndex: 20,
          background: "var(--bg)",
          paddingTop: 14,
          paddingBottom: 14,
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
            <span
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-2)",
              }}
            >
              <SearchIcon />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 38, height: 40 }}
              placeholder="Search baskets by name or thesis"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search baskets by name or thesis"
            />
          </div>
          <Segmented
            value={rebal}
            onChange={(v) => setRebal(v as Rebal)}
            ariaLabel="Rebalancing filter"
            options={[
              ["all", "All"],
              ["auto", "Auto"],
              ["static", "Static"],
            ]}
          />
          <div className="hidden flex-1 sm:block" />
          <Select
            value={sector}
            onChange={setSector}
            options={["All", ...sectors]}
            label="Sector"
          />
          <Select
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            label="Sort"
            options={[
              ["aum", "Highest AUM"],
              ["return", "Top 24h"],
              ["new", "Newest"],
            ]}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="wrap-wide" style={{ paddingBottom: 64 }}>
        {list.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            // Re-keying on the active filters re-mounts the grid so the
            // staggered reveal replays whenever the result set changes.
            key={`${sector}-${rebal}-${sort}-${q}`}
            className="stagger mt-2 grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 xl:grid-cols-3"
          >
            {list.map((b) => (
              <BasketCard key={b.address} basket={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
