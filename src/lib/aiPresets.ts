// Mock "AI composition" presets for the Create wizard. In production this is
// replaced by POST /ai/compose → AIProposal (see integration doc §4.1). Keyed
// loosely by thesis keywords with a sensible default fallback.

export interface PresetConstituent {
  sym: string;
  /** Weight in bps (10000 = 100%). */
  weight: number;
  rationale: string;
}

export interface AIPreset {
  name: string;
  constituents: PresetConstituent[];
  overall: string;
  risk: string;
}

interface MatchablePreset extends AIPreset {
  match: string[];
}

const AI_PRESETS: MatchablePreset[] = [
  {
    match: [
      "defense",
      "defence",
      "military",
      "war",
      "europe",
      "european",
      "rearmament",
      "arms",
      "weapons",
      "missile",
    ],
    name: "European Defense Primes",
    constituents: [
      {
        sym: "RHEMd",
        weight: 3000,
        rationale:
          "Largest European ammunition and land-systems producer; the purest play on sustained continental rearmament.",
      },
      {
        sym: "BAESd",
        weight: 2500,
        rationale:
          "UK prime with deep order book across air, sea, and electronic warfare; stable cash generation.",
      },
      {
        sym: "THLNd",
        weight: 2000,
        rationale:
          "Defense electronics, radar, and secure communications — the digital layer of modern forces.",
      },
      {
        sym: "SAABd",
        weight: 1500,
        rationale:
          "Gripen fighters and missile systems; outsized backlog growth relative to its size.",
      },
      {
        sym: "LDOd",
        weight: 1000,
        rationale:
          "Italian prime adding helicopter and electronics exposure and geographic diversification.",
      },
    ],
    overall:
      "A concentrated basket of the five European defense primes most directly exposed to multi-year government rearmament budgets. Weighted toward pure-play land and ammunition names where order visibility is highest.",
    risk: "Highly correlated to government budget cycles and political headlines. Concentrated in five names, so single-stock events move the basket materially. Currency exposure across EUR, GBP, and SEK.",
  },
  {
    match: [
      "ai",
      "semiconductor",
      "semiconductors",
      "gpu",
      "chip",
      "chips",
      "compute",
      "infrastructure",
      "accelerator",
      "cooling",
      "data cent",
      "datacenter",
      "data-cent",
    ],
    name: "AI Infrastructure ex-US",
    constituents: [
      {
        sym: "TSM",
        weight: 2500,
        rationale:
          "The foundry every AI accelerator depends on; structurally impossible to route around at the leading edge.",
      },
      {
        sym: "ASML",
        weight: 2000,
        rationale:
          "Sole supplier of EUV lithography — the chokepoint enabling every advanced node.",
      },
      {
        sym: "VRT",
        weight: 2000,
        rationale:
          "Data-center power and liquid cooling; demand scales directly with rack density.",
      },
      {
        sym: "ABBNd",
        weight: 1800,
        rationale: "Electrification and grid hardware connecting new data centers to power.",
      },
      {
        sym: "ETN",
        weight: 1700,
        rationale: "Power-management backbone for hyperscale facilities; long-cycle backlog.",
      },
    ],
    overall:
      "Captures the physical AI buildout outside the United States — the foundry, the lithography monopoly, and the power-and-cooling layer the buildout cannot happen without. Deliberately excludes US chip designers to express the ex-US thesis precisely.",
    risk: "Cyclical semiconductor exposure and high valuations leave the basket sensitive to capex-cycle sentiment. Heavy reliance on the Taiwan supply chain concentrates geopolitical risk.",
  },
  {
    match: [
      "nuclear",
      "uranium",
      "reactor",
      "reactors",
      "fission",
      "atom",
      "atomic",
      "smr",
      "enrichment",
    ],
    name: "Nuclear Renaissance",
    constituents: [
      {
        sym: "CCJ",
        weight: 3000,
        rationale:
          "Largest publicly traded uranium miner; direct leverage to the spot price and long-term contracting.",
      },
      {
        sym: "LEU",
        weight: 2500,
        rationale:
          "Domestic enrichment capacity — a strategic bottleneck as Western utilities de-risk supply.",
      },
      {
        sym: "CEG",
        weight: 2000,
        rationale:
          "Largest US nuclear operator; existing baseload fleet repriced by data-center demand.",
      },
      {
        sym: "SMR",
        weight: 1500,
        rationale: "Small modular reactor pioneer; optionality on the next reactor generation.",
      },
      {
        sym: "OKLO",
        weight: 1000,
        rationale:
          "Advanced fission startup; high-risk, high-reward exposure to deployment milestones.",
      },
    ],
    overall:
      "Spans the full nuclear value chain — mining, enrichment, operating fleet, and the SMR frontier — sized from established cash generators down to speculative development-stage names.",
    risk: "Includes pre-revenue developers whose value depends on regulatory and construction milestones. Uranium price swings and political sentiment toward nuclear drive significant volatility.",
  },
];

const DEFAULT_PRESET: AIPreset = {
  name: "Custom Thematic Basket",
  constituents: [
    {
      sym: "NVDA",
      weight: 2500,
      rationale: "Anchor large-cap with the strongest secular tailwind in the thesis.",
    },
    { sym: "TSM", weight: 2000, rationale: "Foundry exposure underpinning the broader theme." },
    { sym: "VRT", weight: 2000, rationale: "Infrastructure layer with direct demand linkage." },
    { sym: "CEG", weight: 1800, rationale: "Power and utilities exposure to balance the basket." },
    {
      sym: "ETN",
      weight: 1700,
      rationale: "Electrical equipment diversifier with a long order backlog.",
    },
  ],
  overall:
    "A balanced starting composition across the core names that fit your thesis. Review each stock and adjust weights to match your conviction before deploying.",
  risk: "A generated starting point — refine the stocks and weights to reflect your specific view. Concentrated baskets carry single-stock risk.",
};

/** Pick the closest preset for a thesis. Multi-word/hyphenated keys match as
   substrings; single words match whole-word (so "renaissance" never matches
   the "ai" preset). */
export function pickPreset(thesis: string): AIPreset {
  const lt = thesis.toLowerCase();
  const words = new Set(lt.split(/[^a-z0-9]+/).filter(Boolean));
  const has = (arr: string[]) =>
    arr.some((k) => (k.includes(" ") || k.includes("-") ? lt.includes(k) : words.has(k)));
  for (const p of AI_PRESETS) if (has(p.match)) return p;
  return DEFAULT_PRESET;
}
