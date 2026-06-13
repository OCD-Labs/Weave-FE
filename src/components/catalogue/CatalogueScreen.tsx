"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UiCatalogueAsset } from "@/lib/api/map";
import { stashBasketDraft } from "@/lib/basketDraft";
import { CatalogueTable } from "./CatalogueTable";

export function CatalogueScreen() {
  const router = useRouter();
  // Preserve selection order; map keyed by address for quick toggle/lookup.
  const [selected, setSelected] = useState<UiCatalogueAsset[]>([]);

  function toggle(asset: UiCatalogueAsset) {
    setSelected((prev) =>
      prev.some((a) => a.address === asset.address)
        ? prev.filter((a) => a.address !== asset.address)
        : [...prev, asset]
    );
  }

  function startCreate() {
    if (selected.length === 0) return;
    stashBasketDraft(selected);
    router.push("/create");
  }

  return (
    <div className="wrap-wide reveal w-full" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 30 }}>Catalogue</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 15 }}>
          Every tokenized equity available for basket construction on Robinhood Chain. Select assets to start a new basket.
        </p>
      </div>

      <CatalogueTable
        selectable
        onToggle={toggle}
        selected={selected.map((a) => a.address)}
      />

      {selected.length > 0 && (
        <div className="float-bar-dock">
          <div className="float-bar" role="region" aria-label="Create basket from selection">
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {selected.length} {selected.length === 1 ? "asset" : "assets"} selected
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="btn btn-subtle"
                style={{ minWidth: 120 }}
                onClick={() => setSelected([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ minWidth: 120 }}
                onClick={startCreate}
              >
                Create basket →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
