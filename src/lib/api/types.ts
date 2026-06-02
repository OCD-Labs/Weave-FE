// DTOs mirroring the Weave backend OpenAPI spec (https://weave.up.railway.app).
// All monetary/price values are STRING big-integer representations in their
// token's smallest unit (USDG 6-dp, NAV/token 18-dp, prices per the oracle).
// Convert with the helpers in lib/units before display — never parseFloat raw.

export interface ApiCatalogueAsset {
  address: string;
  symbol: string;
  name: string;
  sector: string;
  oracle: string;
  isActive: boolean;
  currentPriceUsdg: string;
  priceUpdatedAt: number;
}

export interface ApiPrice {
  address: string;
  priceUsdg: string;
  updatedAt: number;
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
  navPerToken: string;
  totalValueUsdg: string;
}

export interface ApiNavPoint {
  navPerToken: string;
  totalValueUsdg: string;
  timestamp: number;
}

export interface ApiPosition {
  basketAddress: string;
  walletAddress: string;
  totalDepositedUsdg: string;
  totalRedeemedUsdg: string;
  netCostBasisUsdg: string;
}

export interface ApiPortfolio {
  walletAddress: string;
  positions: ApiPosition[];
}

export interface ApiCreatorDashboard {
  walletAddress: string;
  baskets: {
    basketAddress: string;
    creatorTokenAddress: string;
    name: string;
    symbol: string;
  }[];
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
  code: number;
}
