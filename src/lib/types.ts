/* Weave — domain types.
   Mirrors the prototype mock-data shapes; the production backend types live
   in the Frontend Integration Interface Document (BasketSummary, BasketDetail,
   etc.). Weights are in basis points (bps); 10000 bps = 100%. */

export interface CatalogueAsset {
  sym: string;
  name: string;
  sector: string;
  /** Current price in USD. */
  price: number;
  /** 24h price change, percent. */
  chg: number;
}

export interface Constituent {
  sym: string;
  /** Target weight in bps. */
  target: number;
  /** Current (drifted) weight in bps. */
  current: number;
  name: string;
  sector: string;
  price: number;
  chg: number;
}

export interface NavPoint {
  /** Unix timestamp (ms). */
  t: number;
  nav: number;
}

export interface Deposit {
  investor: string;
  usdg: number;
  tokens: number;
  t: number;
}

export interface Rebalance {
  tx: string;
  by: string;
  t: number;
}

export interface Basket {
  address: string;
  /** URL-safe identifier used for routing (symbol, lowercased). */
  slug: string;
  name: string;
  symbol: string;
  thesis: string;
  creator: string;
  creatorName: string;
  createdAt: number;
  rebalancing: boolean;
  /** Drift threshold in bps, or null when rebalancing is disabled. */
  driftBps: number | null;
  /** Assets under management, USD. */
  aum: number;
  navChg24: number;
  navChg7: number;
  navChg30: number;
  /** NAV per token. */
  nav: number;
  maxDriftBps: number;
  needsRebalance: boolean;
  /** True when the basket is suspended and cannot accept deposits. */
  suspended?: boolean;
  constituents: Constituent[];
  history: NavPoint[];
  deposits: Deposit[];
  rebalances: Rebalance[];
}

export interface Position {
  addr: string;
  tokens: number;
  deposited: number;
  basket: Basket;
  value: number;
  pnl: number;
  pnlPct: number;
}

export interface RevenueSnapshot {
  id: number;
  usdg: number;
  t: number;
}

export interface CreatedBasket {
  basket: Basket;
  creatorToken: string;
  tokenBalance: number;
  supply: number;
  ownershipPct: number;
  totalEarned: number;
  claimable: number;
  revenue: RevenueSnapshot[];
}
