// DTOs mirroring the Weave backend (Frontend Integration Specification §2,
// verified against the live API). All monetary/price values are STRING
// big-integer representations in their token's smallest unit:
//   USDG 6-dp · basket/creator tokens 18-dp · oracle prices 8-dp · NAV 18-dp.
// Percentages (`*Pct`) are pre-formatted strings, e.g. "2.45" / "-1.20" / "0.00".
// Convert numeric units with lib/units — never parseFloat a raw integer string.

export interface ApiCatalogueAsset {
  address: string;
  symbol: string;
  name: string;
  sector: string;
  oracle: string;
  isActive: boolean;
  currentPriceUsdg: string; // 8-decimal
  priceChange24hPct: string;
}

export interface ApiPrice {
  address: string;
  symbol: string;
  priceUsdg: string; // 8-decimal
  priceChange24hPct: string;
  timestamp: number;
}

export interface ApiBasketConstituentSummary {
  address: string;
  symbol: string;
  targetWeightBps: number;
  sector: string;
}

export interface ApiBasketSummary {
  address: string;
  creatorToken: string;
  creator: string;
  name: string;
  symbol: string;
  thesis: string;
  rebalancingEnabled: boolean;
  driftThresholdBps: number;
  createdAt: number;
  suspended: boolean;
  navPerToken: string; // 18-decimal
  totalValueUsdg: string; // 6-decimal
  navChange24hPct: string;
  constituentCount: number;
  constituents: ApiBasketConstituentSummary[];
}

export interface ApiBasketDetailConstituent {
  address: string;
  symbol: string;
  name: string;
  sector: string;
  targetWeightBps: string; // string, not number
  currentWeightBps: string; // string, not number
  balanceRaw: string; // 18-decimal
  priceUsdg: string; // 8-decimal, "0" before first price poll
  valueUsdg: string; // 6-decimal, "0" before first price poll
  priceChange24hPct: string;
}

export interface ApiNavPoint {
  navPerToken: string;
  totalValueUsdg: string;
  timestamp: number;
}

export interface ApiBasketDetail {
  address: string;
  creatorToken: string;
  creator: string;
  name: string;
  symbol: string;
  thesis: string;
  rebalancingEnabled: boolean;
  driftThresholdBps: number;
  createdAt: number;
  suspended: boolean;
  navPerToken: string;
  totalValueUsdg: string;
  navChange24hPct: string;
  navChange7dPct: string;
  navChange30dPct: string;
  maxDriftBps: number;
  needsRebalancing: boolean;
  constituents: ApiBasketDetailConstituent[];
  performanceHistory: ApiNavPoint[];
  rebalanceHistory: {
    timestamp: number;
    txHash: string;
    triggeredBy: string;
  }[];
  depositHistory: {
    investor: string;
    usdgAmount: string;
    basketTokensMinted: string;
    timestamp: number;
    txHash: string;
  }[];
  redemptionHistory: {
    investor: string;
    usdgReturned: string;
    basketTokensBurned: string;
    timestamp: number;
    txHash: string;
  }[];
}

/** Single wallet's position in one basket. */
export interface ApiInvestorPosition {
  basketAddress: string;
  walletAddress: string;
  basketName: string;
  basketSymbol: string;
  basketNavPerToken: string; // 18-decimal
  basketTokenBalance: string; // 18-decimal
  currentValueUsdg: string; // 6-decimal
  totalDepositedUsdg: string; // 6-decimal
  unrealisedPnlUsdg: string; // 6-decimal, may be negative
  unrealisedPnlPct: string;
  constituents: ApiBasketConstituentSummary[];
}

export interface ApiPortfolioPosition {
  basketAddress: string;
  basketName: string;
  basketSymbol: string;
  basketNavPerToken: string;
  rebalancingEnabled: boolean;
  suspended: boolean;
  basketTokenBalance: string;
  currentValueUsdg: string;
  totalDepositedUsdg: string;
  unrealisedPnlUsdg: string;
  unrealisedPnlPct: string;
  // Per-position constituents are now returned (no client-side join needed).
  constituents: ApiBasketConstituentSummary[];
}

export interface ApiPortfolio {
  walletAddress: string;
  totalValueUsdg: string;
  totalDepositedUsdg: string;
  totalUnrealisedPnlUsdg: string;
  totalUnrealisedPnlPct: string;
  positions: ApiPortfolioPosition[];
}

export interface ApiCreatorSnapshot {
  snapshotId: number;
  usdgAmount: string;
  timestamp: number;
  txHash?: string;
  claimableByWallet?: string;
}

export interface ApiCreatorBasket {
  basketAddress: string;
  basketName: string;
  basketSymbol: string;
  creatorTokenAddress: string;
  totalValueUsdg: string;
  totalClaimableUsdg: string;
  unclaimedSnapshots: ApiCreatorSnapshot[];
  revenueHistory: ApiCreatorSnapshot[];
}

export interface ApiCreatorDashboard {
  walletAddress: string;
  totalClaimableUsdg: string;
  baskets: ApiCreatorBasket[];
}

export interface ApiCreatorTokenHistory {
  creatorTokenAddress: string;
  totalRevenueUsdg: string;
  snapshots: {
    snapshotId: number;
    usdgAmount: string;
    timestamp: number;
    txHash: string;
  }[];
}

export interface ApiComposeResponse {
  constituents: {
    address: string;
    symbol: string;
    name: string;
    sector: string;
    weightBps: number;
    rationale: string;
    currentPriceUsdg: string;
  }[];
  overallRationale: string;
  riskNotes: string;
  provider: string;
}

export interface ApiError {
  error: string;
}
