"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBaskets, useCatalogue } from "@/lib/api/hooks";
import { mapBasketSummary, type UiBasketSummary } from "@/lib/api/map";
import { BASKETS } from "@/lib/data";
import type { Basket } from "@/lib/types";
import { useDataSource } from "@/lib/dataSource";
import { fmtUsdCompact } from "@/lib/format";
import { SearchIcon } from "../icons";
import { Stat } from "../Stat";
import { Segmented, Select } from "../controls";
import { LiveBasketCard } from "./LiveBasketCard";
import { BasketCard } from "./BasketCard";
import { EmptyState } from "./EmptyState";

type Rebal = "all" | "auto" | "static";
type Sort = "aum" | "new";

/** Cards per page. 12 divides evenly across the 1/2/3-column grid. */
const PAGE_SIZE = 12;

/** Map a full mock Basket into the lean live-summary shape so it can render
   through LiveBasketCard for an apples-to-apples comparison. */
function mockToSummary(b: Basket): UiBasketSummary {
  return {
    address: b.address,
    slug: b.slug,
    creatorToken: b.address,
    creator: b.creator,
    name: b.name,
    symbol: b.symbol,
    thesis: b.thesis,
    rebalancing: b.rebalancing,
    driftThresholdBps: b.driftBps ?? 0,
    createdAt: b.createdAt,
    suspended: b.suspended ?? false,
    nav: b.nav,
    aum: b.aum,
    navChg24: b.navChg24,
    constituentCount: b.constituents.length,
    constituents: b.constituents.map((c) => ({
      sym: c.sym,
      targetWeightBps: c.target,
      sector: c.sector,
    })),
  };
}

export function Marketplace() {
  const dataSource = useDataSource();
  const isMock = dataSource === "mock";

  const { data, isLoading: liveLoading, isError, error, refetch } = useBaskets();
  const { data: catalogue } = useCatalogue();
  const [rebal, setRebalState] = useState<Rebal>("all");
  const [sort, setSortState] = useState<Sort>("aum");
  const [q, setQState] = useState("");
  const [page, setPage] = useState(1);

  // Any filter/search/sort change resets to the first page.
  const setRebal = (v: Rebal) => {
    setRebalState(v);
    setPage(1);
  };
  const setSort = (v: Sort) => {
    setSortState(v);
    setPage(1);
  };
  const setQ = (v: string) => {
    setQState(v);
    setPage(1);
  };

  // In mock mode, keep the full Basket objects too so we can also render the
  // original BasketCard side-by-side with LiveBasketCard.
  const mockBaskets = useMemo<Basket[]>(() => (isMock ? BASKETS : []), [isMock]);
  const summaries = useMemo(
    () => (isMock ? mockBaskets.map(mockToSummary) : (data ?? []).map(mapBasketSummary)),
    [isMock, mockBaskets, data]
  );
  const isLoading = isMock ? false : liveLoading;
  const totalAum = useMemo(() => summaries.reduce((s, b) => s + b.aum, 0), [summaries]);

  // Symbol -> company name, so a query like "Amazon" matches a basket holding
  // AMZN even though the basket summary only carries constituent symbols.
  const symToName = useMemo(() => {
    const m = new Map<string, string>();
    (catalogue ?? []).forEach((a) => m.set(a.symbol.toLowerCase(), a.name.toLowerCase()));
    return m;
  }, [catalogue]);

  // Matches basket name, ticker, thesis, and any constituent by symbol or
  // company name (the latter joined from the catalogue).
  const matchesQuery = (b: UiBasketSummary, query: string) => {
    if (!query) return true;
    if (
      b.name.toLowerCase().includes(query) ||
      b.symbol.toLowerCase().includes(query) ||
      b.thesis.toLowerCase().includes(query)
    )
      return true;
    return b.constituents.some((c) => {
      const sym = c.sym.toLowerCase();
      return sym.includes(query) || (symToName.get(sym)?.includes(query) ?? false);
    });
  };

  const filterFn = (b: UiBasketSummary) => {
    if (rebal === "auto" && !b.rebalancing) return false;
    if (rebal === "static" && b.rebalancing) return false;
    return matchesQuery(b, q.trim().toLowerCase());
  };
  const sortFn = (a: UiBasketSummary, b: UiBasketSummary) =>
    sort === "aum" ? b.aum - a.aum : b.createdAt - a.createdAt;

  const list = useMemo(
    () => summaries.filter(filterFn).sort(sortFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summaries, rebal, sort, q, symToName]
  );

  // Pagination over the filtered list (clamp the page if the list shrank).
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [list, safePage]
  );

  const goToPage = (p: number) => {
    setPage(p);
    document.getElementById("mkt-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Mock full-Basket list filtered the same way (for the comparison row).
  const mockList = useMemo(
    () =>
      mockBaskets.filter((b) => {
        const query = q.trim().toLowerCase();
        if (rebal === "auto" && !b.rebalancing) return false;
        if (rebal === "static" && b.rebalancing) return false;
        if (query && !(b.name.toLowerCase().includes(query) || b.thesis.toLowerCase().includes(query)))
          return false;
        return true;
      }),
    [mockBaskets, rebal, q]
  );

  return (
    <div className="reveal">
      {/* Hero — stat band + primary CTA */}
      <div className="wrap-wide" style={{ paddingTop: 44, paddingBottom: 32 }}>
        <div className="flex flex-col gap-[var(--gap)] lg:flex-row lg:items-stretch lg:justify-between">
          <div className="grid w-full flex-1 grid-cols-2 gap-[var(--gap)] sm:grid-cols-4">
            <Stat big label="Total value woven" value={fmtUsdCompact(totalAum)} />
            <Stat big label="Live baskets" value={summaries.length} />
            <Stat big label="Protocol fee" value="0.50%" />
            <Stat big label="Rebalancing" value="Onchain" sub="via Chainlink" />
          </div>
          {/* <Link
            href="/create"
            className="btn btn-primary btn-lg"
            style={{ whiteSpace: "nowrap", flex: "none" }}
          >
            Create a basket
          </Link> */}
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
              placeholder="Search by name, thesis, or holding (e.g. AMZN)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search baskets by name, thesis, or holding"
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
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            label="Sort"
            options={[
              ["aum", "Highest AUM"],
              ["new", "Newest"],
            ]}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="wrap-wide" style={{ paddingBottom: 64 }}>
        {isMock ? (
          /* Dev comparison view: original mock BasketCard vs new LiveBasketCard */
          <div className="mt-2">
            <div
              className="card"
              style={{
                background: "var(--accent-tint)",
                border: "none",
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--accent-strong)",
              }}
            >
              Mock data · comparing the original design card (full mock data) with the live card
              (lean API shape). Toggle back to “Live” in the bottom-left switch.
            </div>

            <div className="eyebrow" style={{ marginBottom: 10 }}>
              Original BasketCard — full mock data (24h, sparkline, constituents)
            </div>
            <div className="grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 xl:grid-cols-3">
              {mockList.map((b) => (
                <BasketCard key={`mock-${b.address}`} basket={b} />
              ))}
            </div>

            <div className="eyebrow" style={{ margin: "28px 0 10px" }}>
              LiveBasketCard — lean API shape (NAV, AUM, creator, rebalancing)
            </div>
            <div className="grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 xl:grid-cols-3">
              {list.map((b) => (
                <LiveBasketCard key={`live-${b.address}`} basket={b} />
              ))}
            </div>
          </div>
        ) : isLoading ? (
          <div className="mt-2 grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 200, padding: 20 }}>
                <div className="skel" style={{ height: 22, width: "60%" }} />
                <div className="skel" style={{ height: 14, width: "40%", marginTop: 12 }} />
                <div className="skel" style={{ height: 36, width: "100%", marginTop: 16 }} />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card card-pad mt-2 text-center">
            <div className="down" style={{ fontWeight: 700, fontSize: 16 }}>
              Couldn&apos;t load baskets
            </div>
            <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>
              {error instanceof Error ? error.message : "Please try again."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              key={`${rebal}-${sort}-${q}-${safePage}`}
              className="stagger mt-2 grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-2 xl:grid-cols-3"
            >
              {pageItems.map((b) => (
                <LiveBasketCard key={b.address} basket={b} />
              ))}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}

/** Build a compact page window: all pages when few, else first/last with a
   sliding window around the current page and ellipses. */
function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 36,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {pageWindow(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="muted" style={{ padding: "0 6px" }}>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={`btn btn-sm ${n === page ? "btn-primary" : "btn-ghost"}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => onChange(n)}
            style={{ minWidth: 36 }}
          >
            {n}
          </button>
        )
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
