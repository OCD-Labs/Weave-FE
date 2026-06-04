"use client";

import { useMemo, useState } from "react";
import { useCatalogue } from "@/lib/api/hooks";
import { mapCatalogueAsset, type UiCatalogueAsset } from "@/lib/api/map";
import { fmtUsd, fmtPct } from "@/lib/format";
import { SectorPill } from "../badges";
import { Select } from "../controls";
import { SearchIcon } from "../icons";

interface CatalogueTableProps {
  /** When provided, each row shows an "Add" button (modal / create flow). */
  onAdd?: (asset: UiCatalogueAsset) => void;
  /** Asset addresses already chosen, shown as disabled "Added". */
  selected?: string[];
  /** Standalone-page selection mode: hover slide-reveal toggle per row. */
  selectable?: boolean;
  /** Toggle handler for selectable mode. */
  onToggle?: (asset: UiCatalogueAsset) => void;
  /** Cap the scroll height (used inside the modal). */
  maxHeight?: string;
  autoFocus?: boolean;
}

/** Searchable, sector-filterable catalogue of tokenized equities, backed by
   GET /catalogue. Shared by the Create wizard's "Add constituent" modal and
   the standalone /catalogue page. */
export function CatalogueTable({
  onAdd,
  selected = [],
  selectable = false,
  onToggle,
  maxHeight,
  autoFocus,
}: CatalogueTableProps) {
  const { data, isLoading, isError, error, refetch } = useCatalogue();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");

  const assets = useMemo(() => (data ?? []).map(mapCatalogueAsset), [data]);

  const sectors = useMemo(
    () => [...new Set(assets.map((a) => a.sector))].sort(),
    [assets]
  );

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return assets.filter((c) => {
      if (!c.isActive) return false;
      if (sector !== "All" && c.sector !== sector) return false;
      if (q && !(c.sym.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [assets, query, sector]);

  const sectorOptions: [string, string][] = [
    ["All", "All"],
    ...sectors.map((s) => [s, s] as [string, string]),
  ];

  const hasAction = !!onAdd || selectable;
  const colSpan = hasAction ? 6 : 5;

  return (
    <>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
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
            placeholder="Search by ticker or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={autoFocus}
            aria-label="Search catalogue"
          />
        </div>
        <Select value={sector} onChange={setSector} options={sectorOptions} label="Sector" />
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="scroll-x" style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
          <table className="tbl tbl-hover">
            <thead style={{ position: "sticky", top: 0, background: "var(--card)", zIndex: 1 }}>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>24h</th>
                {hasAction && <th style={{ width: 56 }}></th>}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    {Array.from({ length: colSpan }).map((__, j) => (
                      <td key={j}>
                        <div className="skel" style={{ height: 16, width: j === 1 ? "70%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                list.map((c) => {
                  const isSelected = selected.includes(c.address);
                  const rowClass = selectable
                    ? `cat-row ${isSelected ? "cat-row-selected" : ""}`
                    : "";
                  return (
                    <tr
                      key={c.address}
                      className={rowClass}
                      onClick={selectable ? () => onToggle?.(c) : undefined}
                      style={selectable ? { cursor: "pointer" } : undefined}
                    >
                      <td>
                        <span className="tag">{c.sym}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>
                        <SectorPill sector={c.sector} />
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

                      {onAdd && (
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-subtle btn-sm"
                            disabled={isSelected}
                            onClick={() => onAdd(c)}
                          >
                            {isSelected ? "Added" : "Add"}
                          </button>
                        </td>
                      )}

                      {selectable && (
                        <td style={{ textAlign: "right", padding: 0, position: "relative" }}>
                          <span
                            className="cat-toggle"
                            aria-hidden="true"
                            data-selected={isSelected}
                          >
                            {isSelected ? "✓" : "+"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={colSpan} style={{ textAlign: "center", padding: 28 }}>
                    <div className="down" style={{ fontWeight: 600, marginBottom: 8 }}>
                      {error instanceof Error ? error.message : "Failed to load the catalogue."}
                    </div>
                    <button type="button" className="btn btn-subtle btn-sm" onClick={() => refetch()}>
                      Retry
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && list.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    No assets match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
