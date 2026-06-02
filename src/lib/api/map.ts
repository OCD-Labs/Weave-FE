// Mappers from backend API DTOs to the UI-facing shapes the screens render.
// Keeps the components decoupled from raw API field names + string units.

import type { ApiBasketSummary, ApiCatalogueAsset, ApiComposeResponse } from "./types";
import { fromUnits, navToNumber, usdgToNumber, ORACLE_PRICE_DECIMALS } from "../units";

/** UI catalogue asset — display-ready, but retains `address` (needed for the
   real createBasket constituents array) and `isActive`. */
export interface UiCatalogueAsset {
  address: string;
  sym: string;
  name: string;
  sector: string;
  /** Current oracle price in USD (display number). */
  price: number;
  isActive: boolean;
}

export function mapCatalogueAsset(a: ApiCatalogueAsset): UiCatalogueAsset {
  return {
    address: a.address,
    sym: a.symbol,
    name: a.name,
    sector: a.sector,
    // Oracle/catalogue prices are 8-decimal (verified live: AMD "11000000000" = $110.00).
    price: fromUnits(a.currentPriceUsdg, ORACLE_PRICE_DECIMALS),
    isActive: a.isActive,
  };
}

/** UI basket summary for the marketplace list. The list endpoint is lean — it
   has no 24h change, sparkline, or inline constituents — so those are absent
   here rather than fabricated; the card degrades gracefully. */
export interface UiBasketSummary {
  address: string;
  /** URL slug = lowercased on-chain address. */
  slug: string;
  creatorToken: string;
  creator: string;
  name: string;
  symbol: string;
  thesis: string;
  rebalancing: boolean;
  driftThresholdBps: number;
  createdAt: number;
  suspended: boolean;
  /** NAV per token in USD. */
  nav: number;
  /** Total value (AUM) in USD. */
  aum: number;
}

export function mapBasketSummary(b: ApiBasketSummary): UiBasketSummary {
  return {
    address: b.address,
    slug: b.address.toLowerCase(),
    creatorToken: b.creatorToken,
    creator: b.creator,
    name: b.name,
    symbol: b.symbol,
    thesis: b.thesis,
    rebalancing: b.rebalancingEnabled,
    driftThresholdBps: b.driftThresholdBps,
    createdAt: b.createdAt,
    suspended: b.suspended,
    nav: navToNumber(b.navPerToken),
    aum: usdgToNumber(b.totalValueUsdg),
  };
}

/** A single proposed constituent, display-ready, retaining the token address
   needed for the createBasket call. */
export interface UiProposalRow {
  address: string;
  sym: string;
  name: string;
  sector: string;
  price: number;
  weight: number; // bps
  rationale: string;
}

export interface UiProposal {
  constituents: UiProposalRow[];
  overallRationale: string;
  riskNotes: string;
  provider: string;
}

export function mapComposeResponse(r: ApiComposeResponse): UiProposal {
  return {
    constituents: r.constituents.map((c) => ({
      address: c.address,
      sym: c.symbol,
      name: c.name,
      sector: c.sector,
      price: fromUnits(c.currentPriceUsdg, ORACLE_PRICE_DECIMALS),
      weight: c.weightBps,
      rationale: c.rationale,
    })),
    overallRationale: r.overallRationale,
    riskNotes: r.riskNotes,
    provider: r.provider,
  };
}
