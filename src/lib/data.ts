/* Weave — mock data (baskets, catalogue, portfolio, creator revenue).
   Ported from design_handoff_weave_app/data.js.

   The reference used Date.now() and random-free Math.sin history. We pin a
   fixed reference timestamp (NOW) so server and client render identical
   output — no React hydration mismatches — and the synthesized NAV history
   stays deterministic. Swap this module for the real backend (`GET /baskets`,
   `GET /catalogue`, …) when wiring the API. */

import type {
  Basket,
  CatalogueAsset,
  Constituent,
  CreatedBasket,
  NavPoint,
  Position,
} from "./types";

/** Fixed "now" (the integration doc is dated 2026-05-30). */
export const NOW = Date.UTC(2026, 4, 30, 12, 0, 0);
const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;

function genHistory(
  points: number,
  start: number,
  volatility: number,
  drift: number
): NavPoint[] {
  const out: NavPoint[] = [];
  let v = start;
  for (let i = points - 1; i >= 0; i--) {
    const t = NOW - i * DAY;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * volatility;
    v = v * (1 + drift + noise / 100);
    out.push({ t, nav: +v.toFixed(4) });
  }
  return out;
}

/* ---- Catalogue: tokenized equities (plausible, not exhaustive) ---- */
export const CATALOGUE: CatalogueAsset[] = [
  { sym: "RHEMd", name: "Rheinmetall AG", sector: "Defense", price: 612.4, chg: 1.82 },
  { sym: "BAESd", name: "BAE Systems plc", sector: "Defense", price: 17.95, chg: 0.64 },
  { sym: "SAABd", name: "Saab AB", sector: "Defense", price: 28.1, chg: 2.41 },
  { sym: "LDOd", name: "Leonardo S.p.A.", sector: "Defense", price: 24.85, chg: -0.92 },
  { sym: "THLNd", name: "Thales SA", sector: "Defense", price: 168.2, chg: 1.1 },
  { sym: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", price: 138.07, chg: 2.93 },
  { sym: "TSM", name: "Taiwan Semiconductor", sector: "Semiconductors", price: 205.34, chg: 1.44 },
  { sym: "ASML", name: "ASML Holding NV", sector: "Semiconductors", price: 712.55, chg: -0.38 },
  { sym: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", price: 122.18, chg: 3.21 },
  { sym: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors", price: 178.9, chg: 1.67 },
  { sym: "VRT", name: "Vertiv Holdings", sector: "Data Center", price: 118.42, chg: 4.05 },
  { sym: "ETN", name: "Eaton Corp.", sector: "Electrical Equip.", price: 318.77, chg: 0.88 },
  { sym: "CEG", name: "Constellation Energy", sector: "Utilities", price: 245.6, chg: 2.12 },
  { sym: "VST", name: "Vistra Corp.", sector: "Utilities", price: 138.05, chg: 1.93 },
  { sym: "NEE", name: "NextEra Energy", sector: "Utilities", price: 78.33, chg: -0.41 },
  { sym: "CCJ", name: "Cameco Corp.", sector: "Uranium", price: 52.18, chg: 3.74 },
  { sym: "LEU", name: "Centrus Energy", sector: "Uranium", price: 84.4, chg: 5.21 },
  { sym: "SMR", name: "NuScale Power", sector: "Nuclear", price: 22.65, chg: 6.3 },
  { sym: "OKLO", name: "Oklo Inc.", sector: "Nuclear", price: 18.92, chg: -2.18 },
  { sym: "LLY", name: "Eli Lilly & Co.", sector: "Healthcare", price: 798.2, chg: 0.74 },
  { sym: "NVO", name: "Novo Nordisk", sector: "Healthcare", price: 102.55, chg: -1.05 },
  { sym: "VKTX", name: "Viking Therapeutics", sector: "Biotech", price: 68.4, chg: 4.62 },
  { sym: "ISRG", name: "Intuitive Surgical", sector: "MedTech", price: 512.3, chg: 1.21 },
  { sym: "TSLA", name: "Tesla Inc.", sector: "Robotics", price: 342.1, chg: 2.55 },
  { sym: "ABBNd", name: "ABB Ltd.", sector: "Robotics", price: 51.2, chg: 0.92 },
  { sym: "FANUd", name: "Fanuc Corp.", sector: "Robotics", price: 28.74, chg: -0.66 },
  { sym: "ROK", name: "Rockwell Automation", sector: "Robotics", price: 288.45, chg: 1.38 },
  { sym: "NUd", name: "Nu Holdings", sector: "Fintech", price: 13.85, chg: 2.07 },
  { sym: "MELId", name: "MercadoLibre", sector: "Fintech", price: 2104.3, chg: 1.55 },
  { sym: "STNE", name: "StoneCo Ltd.", sector: "Fintech", price: 12.4, chg: -1.84 },
];

const CAT_BY_SYM = new Map(CATALOGUE.map((c) => [c.sym, c]));

interface RawBasket {
  address: string;
  name: string;
  symbol: string;
  thesis: string;
  creator: string;
  creatorName: string;
  createdAt: number;
  rebalancing: boolean;
  driftBps: number | null;
  aum: number;
  navChg24: number;
  navChg7: number;
  navChg30: number;
  nav: number;
  maxDriftBps: number;
  needsRebalance: boolean;
  weights: { sym: string; target: number; current: number }[];
  history: NavPoint[];
}

const RAW_BASKETS: RawBasket[] = [
  {
    address: "0x7Af3…E2b1", name: "European Defense", symbol: "EUDEF",
    thesis:
      "European sovereign defense primes positioned for a decade of sustained rearmament spending as the continent rebuilds strategic autonomy.",
    creator: "0x4D9c…71Aa", creatorName: "thesis.eth", createdAt: NOW - 86 * DAY,
    rebalancing: true, driftBps: 500, aum: 4_820_000, navChg24: 1.74, navChg7: 4.2, navChg30: 11.8,
    nav: 1.382, maxDriftBps: 210, needsRebalance: false,
    weights: [
      { sym: "RHEMd", target: 3000, current: 3180 },
      { sym: "BAESd", target: 2500, current: 2410 },
      { sym: "THLNd", target: 2000, current: 1960 },
      { sym: "SAABd", target: 1500, current: 1530 },
      { sym: "LDOd", target: 1000, current: 920 },
    ],
    history: genHistory(120, 1.0, 0.9, 0.0026),
  },
  {
    address: "0x3Bc1…9aD4", name: "AI Infrastructure ex-US", symbol: "AIXUS",
    thesis:
      "The physical backbone of AI built outside the United States — data-center power, cooling, and the semiconductor supply chain that the buildout cannot happen without.",
    creator: "0x91Fe…2C0b", creatorName: "kosmos.eth", createdAt: NOW - 54 * DAY,
    rebalancing: true, driftBps: 400, aum: 9_140_000, navChg24: 2.91, navChg7: 6.7, navChg30: 18.3,
    nav: 1.741, maxDriftBps: 380, needsRebalance: true,
    weights: [
      { sym: "TSM", target: 2500, current: 2720 },
      { sym: "ASML", target: 2000, current: 1880 },
      { sym: "VRT", target: 2000, current: 2310 },
      { sym: "ABBNd", target: 1800, current: 1640 },
      { sym: "ETN", target: 1700, current: 1450 },
    ],
    history: genHistory(120, 1.0, 1.4, 0.0041),
  },
  {
    address: "0x5Ee8…1F77", name: "Nuclear Renaissance", symbol: "ATOM",
    thesis:
      "Uranium miners, enrichment, and the small-modular-reactor pioneers powering the return of nuclear as baseload for an electrified, compute-hungry grid.",
    creator: "0x2A7d…E33c", creatorName: "fission.eth", createdAt: NOW - 31 * DAY,
    rebalancing: false, driftBps: null, aum: 2_360_000, navChg24: -1.42, navChg7: 8.9, navChg30: 24.6,
    nav: 1.518, maxDriftBps: 0, needsRebalance: false,
    weights: [
      { sym: "CCJ", target: 3000, current: 2740 },
      { sym: "LEU", target: 2500, current: 2980 },
      { sym: "CEG", target: 2000, current: 1910 },
      { sym: "SMR", target: 1500, current: 1680 },
      { sym: "OKLO", target: 1000, current: 690 },
    ],
    history: genHistory(120, 1.0, 2.1, 0.0049),
  },
  {
    address: "0x9Cd2…44Ba", name: "Metabolic Health", symbol: "GLP1",
    thesis:
      "The GLP-1 obesity and metabolic platform — incumbents with approved drugs plus the next-wave biotech challengers reshaping a trillion-dollar treatment market.",
    creator: "0x4D9c…71Aa", creatorName: "thesis.eth", createdAt: NOW - 22 * DAY,
    rebalancing: true, driftBps: 600, aum: 6_730_000, navChg24: 0.62, navChg7: -1.8, navChg30: 7.1,
    nav: 1.094, maxDriftBps: 150, needsRebalance: false,
    weights: [
      { sym: "LLY", target: 3500, current: 3560 },
      { sym: "NVO", target: 3000, current: 2890 },
      { sym: "VKTX", target: 2000, current: 2180 },
      { sym: "ISRG", target: 1500, current: 1370 },
    ],
    history: genHistory(120, 1.0, 1.1, 0.0011),
  },
  {
    address: "0x1Fa6…87Dc", name: "Sovereign Compute", symbol: "GPU",
    thesis:
      "The merchant silicon at the center of the AI arms race — GPU and accelerator designers plus the foundry capacity every nation now wants on its own soil.",
    creator: "0x91Fe…2C0b", creatorName: "kosmos.eth", createdAt: NOW - 12 * DAY,
    rebalancing: false, driftBps: null, aum: 12_480_000, navChg24: 3.31, navChg7: 9.4, navChg30: 27.2,
    nav: 1.903, maxDriftBps: 0, needsRebalance: false,
    weights: [
      { sym: "NVDA", target: 3500, current: 3920 },
      { sym: "AVGO", target: 2000, current: 1840 },
      { sym: "AMD", target: 2000, current: 2110 },
      { sym: "TSM", target: 1500, current: 1350 },
      { sym: "ASML", target: 1000, current: 780 },
    ],
    history: genHistory(120, 1.0, 1.7, 0.0057),
  },
  {
    address: "0x6Bb9…03Ee", name: "Grid Modernization", symbol: "GRID",
    thesis:
      "Electrical equipment, transmission, and the regulated utilities rebuilding an aging grid for electrification, reshoring, and surging data-center load.",
    creator: "0x7C2a…99Fd", creatorName: "voltaic.eth", createdAt: NOW - 41 * DAY,
    rebalancing: true, driftBps: 500, aum: 3_910_000, navChg24: 0.88, navChg7: 2.1, navChg30: 9.4,
    nav: 1.247, maxDriftBps: 260, needsRebalance: false,
    weights: [
      { sym: "ETN", target: 3000, current: 3140 },
      { sym: "VRT", target: 2500, current: 2680 },
      { sym: "NEE", target: 2000, current: 1840 },
      { sym: "VST", target: 1500, current: 1490 },
      { sym: "CEG", target: 1000, current: 850 },
    ],
    history: genHistory(120, 1.0, 1.0, 0.0023),
  },
  {
    address: "0x8Dd4…12Ac", name: "Robotics & Automation", symbol: "ROBO",
    thesis:
      "Industrial automation, humanoid robotics, and the motion-control supply chain that turns the labor shortage into a capital-equipment supercycle.",
    creator: "0x7C2a…99Fd", creatorName: "voltaic.eth", createdAt: NOW - 8 * DAY,
    rebalancing: true, driftBps: 700, aum: 1_780_000, navChg24: 1.15, navChg7: 3.6, navChg30: 6.2,
    nav: 1.061, maxDriftBps: 320, needsRebalance: false,
    weights: [
      { sym: "TSLA", target: 2500, current: 2640 },
      { sym: "ABBNd", target: 2000, current: 1920 },
      { sym: "ROK", target: 2000, current: 1980 },
      { sym: "FANUd", target: 1500, current: 1410 },
      { sym: "ISRG", target: 2000, current: 2050 },
    ],
    history: genHistory(120, 1.0, 1.2, 0.0017),
  },
  {
    address: "0x2Ff7…6bB0", name: "LatAm Fintech", symbol: "LATFI",
    thesis:
      "The digital-banking and payments platforms bringing 600 million underbanked Latin Americans onchain and online for the first time.",
    creator: "0x5E1b…A4d2", creatorName: "andino.eth", createdAt: NOW - 67 * DAY,
    rebalancing: false, driftBps: null, aum: 980_000, navChg24: -0.74, navChg7: 1.2, navChg30: -3.4,
    nav: 0.918, maxDriftBps: 0, needsRebalance: false,
    weights: [
      { sym: "NUd", target: 4000, current: 4220 },
      { sym: "MELId", target: 3500, current: 3380 },
      { sym: "STNE", target: 2500, current: 2400 },
    ],
    history: genHistory(120, 1.0, 1.6, -0.0009),
  },
];

function resolveConstituents(
  weights: { sym: string; target: number; current: number }[]
): Constituent[] {
  return weights.map((w) => {
    const m = CAT_BY_SYM.get(w.sym);
    if (!m) throw new Error(`Unknown catalogue symbol: ${w.sym}`);
    return {
      sym: w.sym, target: w.target, current: w.current,
      name: m.name, sector: m.sector, price: m.price, chg: m.chg,
    };
  });
}

export const BASKETS: Basket[] = RAW_BASKETS.map((b) => ({
  ...b,
  slug: b.symbol.toLowerCase(),
  constituents: resolveConstituents(b.weights),
  deposits: [
    { investor: "0x4D9c…71Aa", usdc: 250000, tokens: 180890, t: NOW - 2 * HOUR },
    { investor: "0xA1b2…77Cd", usdc: 50000, tokens: 36178, t: NOW - 9 * HOUR },
    { investor: "0x91Fe…2C0b", usdc: 120000, tokens: 86827, t: NOW - 26 * HOUR },
    { investor: "0x33Aa…0bE1", usdc: 8000, tokens: 5788, t: NOW - 50 * HOUR },
  ],
  rebalances: b.rebalancing
    ? [
        { tx: "0x9f…a2", by: "Chainlink Automation", t: NOW - 31 * HOUR },
        { tx: "0x4c…7e", by: "Chainlink Automation", t: NOW - 96 * HOUR },
      ]
    : [],
}));

const BASKET_BY_ADDRESS = new Map(BASKETS.map((b) => [b.address, b]));

export function getBasketBySlug(slug: string): Basket | undefined {
  return BASKETS.find((b) => b.slug === slug);
}

/** Look up a catalogue asset by ticker symbol. */
export function getAsset(sym: string): CatalogueAsset | undefined {
  return CATALOGUE.find((c) => c.sym === sym);
}

/** Unique sectors across the catalogue, sorted. */
export const SECTORS = [...new Set(CATALOGUE.map((c) => c.sector))].sort();

/** Total value woven across all baskets. */
export const TOTAL_AUM = BASKETS.reduce((s, b) => s + b.aum, 0);

/** Connected wallet (prototype). */
export const WALLET = "0x4D9c…71Aa";

/* ---- Connected wallet's portfolio ---- */
export const POSITIONS: Position[] = (
  [
    { addr: "0x3Bc1…9aD4", tokens: 86827, deposited: 120000 },
    { addr: "0x5Ee8…1F77", tokens: 41200, deposited: 58000 },
    { addr: "0x9Cd2…44Ba", tokens: 22840, deposited: 26000 },
    { addr: "0x6Bb9…03Ee", tokens: 96150, deposited: 115000 },
  ] as const
).map((p) => {
  const basket = BASKET_BY_ADDRESS.get(p.addr)!;
  const value = p.tokens * basket.nav;
  return {
    ...p, basket, value,
    pnl: value - p.deposited,
    pnlPct: ((value - p.deposited) / p.deposited) * 100,
  };
});

/* ---- Creator dashboard (baskets created by WALLET = thesis.eth) ---- */
export const CREATED: CreatedBasket[] = BASKETS.filter(
  (b) => b.creator === WALLET
).map((b) => {
  const earned = b.aum * 0.005 * 0.8 * 0.35; // illustrative cumulative
  const claimable = earned * 0.22;
  return {
    basket: b,
    creatorToken: b.address.replace("0x", "0xC"),
    tokenBalance: 1_000_000,
    supply: 1_000_000,
    ownershipPct: 100,
    totalEarned: earned,
    claimable,
    revenue: [4, 3, 5, 6, 5, 7, 8, 9, 11, 10, 13, 14].map((v, i) => ({
      id: i + 1,
      usdc: v * (b.aum / 4_820_000) * 90,
      t: NOW - (12 - i) * 7 * DAY,
    })),
  };
});
