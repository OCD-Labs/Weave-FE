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

// Bundled defaults: Robinhood Chain Testnet deployment (see integration reference).
const DEFAULTS: Record<string, string> = {
  NEXT_PUBLIC_REGISTRY_ADDRESS: "0xE46331c15A61c8F99114c970f607E9b199603bb9",
  NEXT_PUBLIC_BASKET_FACTORY_ADDRESS: "0x436d3EB9f79416b9d9d33CEe60423dc1Dc2d3d43",
  NEXT_PUBLIC_BASKET_IMPLEMENTATION_ADDRESS: "0x977134d124C90F43F26E43Ad973214dd95b2a320",
  NEXT_PUBLIC_USDG_ADDRESS: "0x7E955252E15c84f5768B83c41a71F9eba181802F",
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
} as const;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 46630);

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.testnet.chain.robinhood.com";

/** Build a block-explorer URL for a tx hash or address. */
export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}
export function explorerAddress(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
