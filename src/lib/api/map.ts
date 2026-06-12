// Mappers from backend API DTOs to the UI-facing shapes the screens render.
// Keeps the components decoupled from raw API field names + string units.

import type {
  ApiBasketDetail,
  ApiBasketSummary,
  ApiCatalogueAsset,
  ApiComposeResponse,
  ApiCreatorDashboard,
  ApiPortfolio,
} from "./types";
import { fromUnits, tokensToNumber, usdgToNumber, ORACLE_PRICE_DECIMALS } from "../units";

const pct = (s: string | undefined) => parseFloat(s ?? "0") || 0;

// The backend serialises `navPerToken` as a 6-decimal USDG value (verified
// live: "957151" = $0.957), despite the spec labelling it 18-decimal. The
// CONTRACT's navPerToken() is genuinely 18-decimal — that path stays separate.
const apiNavToNumber = (v: string) => fromUnits(v, 6);

/** UI catalogue asset — display-ready, but retains `address` (needed for the
   real createBasket constituents array) and `isActive`. */
export interface UiCatalogueAsset {
  address: string;
  sym: string;
  name: string;
  sector: string;
  /** Current oracle price in USD (display number). */
  price: number;
  /** 24h price change, percent. */
  chg: number;
  isActive: boolean;
}

export function mapCatalogueAsset(a: ApiCatalogueAsset): UiCatalogueAsset {
  return {
    address: a.address,
    sym: a.symbol,
    name: a.name,
    sector: a.sector,
    // Oracle/catalogue prices are 8-decimal (verified live: AMD "49701000000" = $497.01).
    price: fromUnits(a.currentPriceUsdg, ORACLE_PRICE_DECIMALS),
    chg: pct(a.priceChange24hPct),
    isActive: a.isActive,
  };
}

export interface UiBasketConstituentSummary {
  sym: string;
  targetWeightBps: number;
  sector: string;
}

/** UI basket summary for the marketplace list. */
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
  /** 24h NAV change, percent. */
  navChg24: number;
  constituentCount: number;
  constituents: UiBasketConstituentSummary[];
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
    nav: apiNavToNumber(b.navPerToken),
    aum: usdgToNumber(b.totalValueUsdg),
    navChg24: pct(b.navChange24hPct),
    constituentCount: b.constituentCount,
    constituents: (b.constituents ?? []).map((c) => ({
      sym: c.symbol,
      targetWeightBps: c.targetWeightBps,
      sector: c.sector,
    })),
  };
}

/** UI basket detail — fully display-ready, used by the basket page. */
export interface UiBasketDetailConstituent {
  address: string;
  sym: string;
  name: string;
  sector: string;
  /** Target weight in bps. */
  target: number;
  /** Current (drifted) weight in bps. */
  current: number;
  /** Current oracle price in USD. */
  price: number;
  /** 24h price change, percent. */
  chg: number;
  /** USD value of this constituent in the basket. */
  value: number;
}

export interface UiNavPoint {
  /** Unix timestamp (ms). */
  t: number;
  nav: number;
}

export interface UiBasketDetail {
  address: string;
  slug: string;
  creatorToken: string;
  creator: string;
  name: string;
  symbol: string;
  thesis: string;
  rebalancing: boolean;
  driftBps: number;
  createdAt: number;
  suspended: boolean;
  nav: number;
  aum: number;
  navChg24: number;
  navChg7: number;
  navChg30: number;
  maxDriftBps: number;
  needsRebalance: boolean;
  constituents: UiBasketDetailConstituent[];
  history: UiNavPoint[];
  deposits: {
    investor: string;
    usdc: number;
    tokens: number;
    t: number;
    txHash: string;
  }[];
  rebalances: { tx: string; by: string; t: number }[];
}

export function mapBasketDetail(b: ApiBasketDetail): UiBasketDetail {
  return {
    address: b.address,
    slug: b.address.toLowerCase(),
    creatorToken: b.creatorToken,
    creator: b.creator,
    name: b.name,
    symbol: b.symbol,
    thesis: b.thesis,
    rebalancing: b.rebalancingEnabled,
    driftBps: b.driftThresholdBps,
    createdAt: b.createdAt,
    suspended: b.suspended,
    nav: apiNavToNumber(b.navPerToken),
    aum: usdgToNumber(b.totalValueUsdg),
    navChg24: pct(b.navChange24hPct),
    navChg7: pct(b.navChange7dPct),
    navChg30: pct(b.navChange30dPct),
    maxDriftBps: b.maxDriftBps,
    needsRebalance: b.needsRebalancing,
    constituents: (b.constituents ?? []).map((c) => ({
      address: c.address,
      sym: c.symbol,
      name: c.name,
      sector: c.sector,
      target: parseInt(c.targetWeightBps, 10) || 0,
      current: parseInt(c.currentWeightBps, 10) || 0,
      price: fromUnits(c.priceUsdg, ORACLE_PRICE_DECIMALS),
      chg: pct(c.priceChange24hPct),
      value: usdgToNumber(c.valueUsdg),
    })),
    history: b.performanceHistory.map((p) => ({
      t: p.timestamp * 1000,
      nav: apiNavToNumber(p.navPerToken),
    })),
    deposits: b.depositHistory.map((d) => ({
      investor: d.investor,
      usdc: usdgToNumber(d.usdgAmount),
      tokens: fromUnits(d.basketTokensMinted, 18),
      t: d.timestamp * 1000,
      txHash: d.txHash,
    })),
    rebalances: b.rebalanceHistory.map((r) => ({
      tx: r.txHash,
      by: r.triggeredBy,
      t: r.timestamp * 1000,
    })),
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

/* ---- Portfolio ---- */

export interface UiPosition {
  basketAddress: string;
  slug: string;
  name: string;
  symbol: string;
  rebalancing: boolean;
  suspended: boolean;
  /** Basket-token balance (display number). */
  tokens: number;
  /** Current value in USD. */
  value: number;
  /** Total deposited (cost basis) in USD. */
  deposited: number;
  /** Unrealised P&L in USD. */
  pnl: number;
  pnlPct: number;
  /** NAV per token in USD. */
  nav: number;
  constituents: UiBasketConstituentSummary[];
}

export interface UiPortfolio {
  totalValue: number;
  totalDeposited: number;
  totalPnl: number;
  totalPnlPct: number;
  positions: UiPosition[];
}

export function mapPortfolio(p: ApiPortfolio): UiPortfolio {
  return {
    totalValue: usdgToNumber(p.totalValueUsdg),
    totalDeposited: usdgToNumber(p.totalDepositedUsdg),
    totalPnl: usdgToNumber(p.totalUnrealisedPnlUsdg),
    totalPnlPct: pct(p.totalUnrealisedPnlPct),
    positions: p.positions.map((pos) => ({
      basketAddress: pos.basketAddress,
      slug: pos.basketAddress.toLowerCase(),
      name: pos.basketName,
      symbol: pos.basketSymbol,
      rebalancing: pos.rebalancingEnabled,
      suspended: pos.suspended,
      tokens: tokensToNumber(pos.basketTokenBalance),
      value: usdgToNumber(pos.currentValueUsdg),
      deposited: usdgToNumber(pos.totalDepositedUsdg),
      pnl: usdgToNumber(pos.unrealisedPnlUsdg),
      pnlPct: pct(pos.unrealisedPnlPct),
      nav: apiNavToNumber(pos.basketNavPerToken),
      constituents: (pos.constituents ?? []).map((c) => ({
        sym: c.symbol,
        targetWeightBps: c.targetWeightBps,
        sector: c.sector,
      })),
    })),
  };
}

/* ---- Creator dashboard ---- */

export interface UiCreatorBasket {
  basketAddress: string;
  slug: string;
  name: string;
  symbol: string;
  creatorToken: string;
  aum: number;
  claimable: number;
  /** Total revenue earned to date (sum of revenue history). */
  totalEarned: number;
  /** Revenue per snapshot, oldest→newest, in USD. */
  revenue: { id: number; usdc: number; t: number }[];
}

export interface UiCreatorDashboard {
  totalClaimable: number;
  totalEarned: number;
  totalAum: number;
  baskets: UiCreatorBasket[];
}

export function mapCreatorDashboard(c: ApiCreatorDashboard): UiCreatorDashboard {
  const baskets: UiCreatorBasket[] = c.baskets.map((b) => {
    const revenue = (b.revenueHistory ?? []).map((s) => ({
      id: s.snapshotId,
      usdc: usdgToNumber(s.usdgAmount),
      t: s.timestamp * 1000,
    }));
    const totalEarned = revenue.reduce((sum, r) => sum + r.usdc, 0);
    return {
      basketAddress: b.basketAddress,
      slug: b.basketAddress.toLowerCase(),
      name: b.basketName,
      symbol: b.basketSymbol,
      creatorToken: b.creatorTokenAddress,
      aum: usdgToNumber(b.totalValueUsdg),
      claimable: usdgToNumber(b.totalClaimableUsdg),
      totalEarned,
      revenue,
    };
  });
  return {
    totalClaimable: usdgToNumber(c.totalClaimableUsdg),
    totalEarned: baskets.reduce((s, b) => s + b.totalEarned, 0),
    totalAum: baskets.reduce((s, b) => s + b.aum, 0),
    baskets,
  };
}
