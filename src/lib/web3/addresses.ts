import type { Address } from "viem";

function required(name: string, value: string | undefined): Address {
  if (!value || value === "0x...") {
    // Fall back to the known testnet deployment so the app still builds/runs
    // if an env var is missing; log so it's noticed in dev.
    if (typeof window !== "undefined") {
      console.warn(`[web3] env ${name} is missing — using bundled testnet default`);
    }
  }
  return (value && value !== "0x..." ? value : DEFAULTS[name]) as Address;
}

// Bundled defaults: Robinhood Chain Testnet deployment (Frontend Integration
// Specification §15, redeployed 2026-06-04).
const DEFAULTS: Record<string, string> = {
  NEXT_PUBLIC_REGISTRY_ADDRESS: "0x19Ab3408af6503a7D4BeC255b064f8B02A345D04",
  NEXT_PUBLIC_BASKET_FACTORY_ADDRESS: "0xE9854c4734cd4A9dbC5086398A11df3c11f40b21",
  NEXT_PUBLIC_BASKET_IMPLEMENTATION_ADDRESS: "0x1aceE18129477c0312228d306fD02313E9767F4E",
  NEXT_PUBLIC_USDG_ADDRESS: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
  // Governance / automation surface (Frontend Integration Specification §15–16).
  NEXT_PUBLIC_SWAP_ROUTER_ADDRESS: "0x2953A82d44fDACfa7a49BfFF24f7Cc5879F10805",
  NEXT_PUBLIC_AUTOMATION_ADDRESS: "0xCc10bF2f35ae47B4F946db8dc31f0f56b5b7D186",
  NEXT_PUBLIC_GOVERNANCE_ADDRESS: "0x4e4B989abE79381C1B8a4871d6aF481B175F4865",
};

export const CONTRACTS = {
  registry: required("NEXT_PUBLIC_REGISTRY_ADDRESS", process.env.NEXT_PUBLIC_REGISTRY_ADDRESS),
  factory: required(
    "NEXT_PUBLIC_BASKET_FACTORY_ADDRESS",
    process.env.NEXT_PUBLIC_BASKET_FACTORY_ADDRESS
  ),
  basketImplementation: required(
    "NEXT_PUBLIC_BASKET_IMPLEMENTATION_ADDRESS",
    process.env.NEXT_PUBLIC_BASKET_IMPLEMENTATION_ADDRESS
  ),
  usdg: required("NEXT_PUBLIC_USDG_ADDRESS", process.env.NEXT_PUBLIC_USDG_ADDRESS),
  swapRouter: required(
    "NEXT_PUBLIC_SWAP_ROUTER_ADDRESS",
    process.env.NEXT_PUBLIC_SWAP_ROUTER_ADDRESS
  ),
  automation: required("NEXT_PUBLIC_AUTOMATION_ADDRESS", process.env.NEXT_PUBLIC_AUTOMATION_ADDRESS),
} as const;

/** Governance address that holds onlyGovernance rights on the registry/automation.
   The admin dashboard reads governance() live and falls back to this. */
export const GOVERNANCE_ADDRESS = required(
  "NEXT_PUBLIC_GOVERNANCE_ADDRESS",
  process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS
);

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 46630);

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.testnet.chain.robinhood.com";

/** True for a real 20-byte hex address (mock data uses shortened "0x..….."). */
export function isRealAddress(addr: string | undefined): addr is Address {
  return !!addr && /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Build a block-explorer URL for a tx hash or address. */
export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}
export function explorerAddress(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
