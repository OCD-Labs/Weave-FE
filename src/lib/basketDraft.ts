import type { UiCatalogueAsset } from "./api/map";

// One-shot hand-off of catalogue selections into the Create wizard, via
// sessionStorage so it survives the route change but doesn't linger.

const KEY = "weave:basketDraft";

export interface BasketDraftAsset {
  address: string;
  sym: string;
  name: string;
  sector: string;
  price: number;
}

/** Stash the assets selected on the catalogue page for the Create wizard. */
export function stashBasketDraft(assets: UiCatalogueAsset[]): void {
  if (typeof window === "undefined") return;
  const payload: BasketDraftAsset[] = assets.map((a) => ({
    address: a.address,
    sym: a.sym,
    name: a.name,
    sector: a.sector,
    price: a.price,
  }));
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Read-and-clear the stashed draft (consumed once by the Create wizard). */
export function takeBasketDraft(): BasketDraftAsset[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as BasketDraftAsset[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}
