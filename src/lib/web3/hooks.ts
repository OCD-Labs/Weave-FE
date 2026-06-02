"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { parseAbi, type Address } from "viem";
import { basketAbi, registryAbi } from "./abis";
import { CONTRACTS } from "./addresses";
import { tokensToNumber, usdgToNumber } from "../units";

const REGISTRY = parseAbi(registryAbi);
const BASKET = parseAbi(basketAbi);

// Sensible fallbacks (verified live on testnet) so the UI works even if the
// reads are pending or the RPC hiccups.
const DEFAULTS = {
  managementFeeBps: 50,
  minFirstDepositUsdg: 10_000_000n, // $10.00 (6-dp)
  maxConstituents: 20,
  minWeightBps: 100,
  protocolShareBps: 2000,
};

export interface RegistryParams {
  managementFeeBps: number;
  /** Minimum first deposit, in USD. */
  minFirstDepositUsd: number;
  minFirstDepositRaw: bigint;
  maxConstituents: number;
  minWeightBps: number;
  protocolShareBps: number;
  creatorShareBps: number;
  /** True while still loading (values are defaults until then). */
  isLoading: boolean;
}

/** Reads the protocol-wide parameters from WeaveRegistry for fee preview and
   create-form validation. Returns verified defaults until the reads resolve. */
export function useRegistryParams(): RegistryParams {
  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: CONTRACTS.registry, abi: REGISTRY, functionName: "managementFeeBps" },
      { address: CONTRACTS.registry, abi: REGISTRY, functionName: "minFirstDepositUsdg" },
      { address: CONTRACTS.registry, abi: REGISTRY, functionName: "maxConstituents" },
      { address: CONTRACTS.registry, abi: REGISTRY, functionName: "minWeightBps" },
      { address: CONTRACTS.registry, abi: REGISTRY, functionName: "protocolShareBps" },
    ],
    query: { staleTime: 5 * 60_000 }, // protocol params rarely change
  });

  const feeBps = num(data?.[0]?.result, DEFAULTS.managementFeeBps);
  const minDepRaw = big(data?.[1]?.result, DEFAULTS.minFirstDepositUsdg);
  const maxC = num(data?.[2]?.result, DEFAULTS.maxConstituents);
  const minW = num(data?.[3]?.result, DEFAULTS.minWeightBps);
  const protocolShare = num(data?.[4]?.result, DEFAULTS.protocolShareBps);

  return {
    managementFeeBps: feeBps,
    minFirstDepositUsd: usdgToNumber(minDepRaw),
    minFirstDepositRaw: minDepRaw,
    maxConstituents: maxC,
    minWeightBps: minW,
    protocolShareBps: protocolShare,
    creatorShareBps: 10_000 - protocolShare,
    isLoading,
  };
}

function num(v: unknown, fallback: number): number {
  return typeof v === "bigint" ? Number(v) : fallback;
}
function big(v: unknown, fallback: bigint): bigint {
  return typeof v === "bigint" ? v : fallback;
}

/** The connected wallet's basket-token balance — the source of truth for the
   redeem form (per the integration reference). Raw (18-dp) + display number. */
export function useBasketBalance(basket?: Address) {
  const { address } = useAccount();
  const { data, refetch, isLoading } = useReadContract({
    address: basket,
    abi: BASKET,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!basket && !!address },
  });
  const raw = (data as bigint | undefined) ?? 0n;
  return { raw, balance: tokensToNumber(raw), refetch, isLoading };
}

/** Live check whether the basket currently needs rebalancing (controls the
   Rebalance Now button). Read fresh, never cached. */
export function useNeedsRebalancing(basket?: Address) {
  const { data, refetch } = useReadContract({
    address: basket,
    abi: BASKET,
    functionName: "needsRebalancing",
    query: { enabled: !!basket, refetchInterval: 30_000 },
  });
  return { needsRebalancing: (data as boolean | undefined) ?? false, refetch };
}
