"use client";

import { useCallback, useMemo, useState } from "react";
import { parseAbi, type Abi, type Address } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { registryAdminAbi, automationAbi, swapRouterAbi } from "./abis";
import { CONTRACTS, GOVERNANCE_ADDRESS } from "./addresses";
import { decodeContractError } from "./errors";
import { useDataSource } from "@/lib/dataSource";
import { useToast } from "@/components/toast/ToastProvider";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/** Placeholder settings so the dashboard can be previewed in mock mode without
   the governance wallet (or any chain reads). */
const MOCK_REGISTRY: RegistrySettings = {
  managementFeeBps: 50n,
  protocolShareBps: 2000n,
  creatorShareBps: 8000n,
  minFirstDepositUsdg: 10_000_000n,
  maxConstituents: 20n,
  minWeightBps: 100n,
  oracleStalenessSecs: 3600n,
  minRebalanceTradeSizeUsdg: 1_000_000n,
  maxSwapSlippageBps: 100n,
  minAUMUsdg: 1_000_000_000n,
  protocolTreasury: GOVERNANCE_ADDRESS,
  swapRouter: CONTRACTS.swapRouter,
  basketFactory: CONTRACTS.factory,
  automationContract: CONTRACTS.automation,
  governance: GOVERNANCE_ADDRESS,
  pendingGovernance: ZERO,
  paused: false,
};
const MOCK_AUTOMATION: AutomationSettings = { batchSize: 50n, maxRebalanceSlippageBps: 50n };
const MOCK_SPREAD = 30n;

export const REGISTRY_ADMIN = parseAbi(registryAdminAbi);
export const AUTOMATION = parseAbi(automationAbi);
export const SWAP_ROUTER = parseAbi(swapRouterAbi);

const eq = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** A single governance/owner write target. */
export interface AdminWriteReq {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

/**
 * Drives a governance/owner write: pre-simulate (surfaces the on-chain revert,
 * e.g. onlyGovernance, before the wallet prompt) → write → wait → toast. Tracks
 * a single in-flight action by key so the calling row can show a spinner.
 */
export function useAdminWrite() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const isMock = useDataSource() === "mock";
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const send = useCallback(
    async (key: string, label: string, req: AdminWriteReq, onSuccess?: () => void) => {
      // Mock preview: keep the UI interactive without sending anything onchain.
      if (isMock) {
        toast(`${label}: mock preview, no transaction sent`, "success");
        onSuccess?.();
        return;
      }
      if (!address || !publicClient) {
        toast("Connect your wallet.", "error");
        return;
      }
      setPendingKey(key);
      try {
        const base = {
          address: req.address,
          abi: req.abi,
          functionName: req.functionName,
          args: req.args,
          account: address,
        };
        // Pre-simulate so reverts (onlyGovernance, InvalidParameter, etc.) show
        // before the user is asked to sign. These web3 calls are heavily
        // generic; cast to each call's own param type rather than a shared one.
        await publicClient.simulateContract(
          base as Parameters<typeof publicClient.simulateContract>[0]
        );
        toast(`${label}: confirm in wallet`, "pending");
        const hash = await writeContractAsync(base as Parameters<typeof writeContractAsync>[0]);
        toast(`${label}: submitted`, "pending");
        await publicClient.waitForTransactionReceipt({ hash });
        toast(`${label}: confirmed`, "success");
        onSuccess?.();
      } catch (err) {
        toast(`${label}: ${decodeContractError(err)}`, "error");
      } finally {
        setPendingKey(null);
      }
    },
    [isMock, address, publicClient, writeContractAsync, toast]
  );

  return { pendingKey, send };
}

/** Live governance address (falls back to the bundled deployment constant). */
export function useGovernanceAddress(): Address | undefined {
  const { data } = useReadContract({
    address: CONTRACTS.registry,
    abi: REGISTRY_ADMIN,
    functionName: "governance",
    query: { staleTime: 60_000 },
  });
  return (data as Address | undefined) ?? GOVERNANCE_ADDRESS;
}

/** SwapRouter owner (a deployer EOA, distinct from governance). */
export function useRouterOwner(): Address | undefined {
  const { data } = useReadContract({
    address: CONTRACTS.swapRouter,
    abi: SWAP_ROUTER,
    functionName: "owner",
    query: { staleTime: 60_000 },
  });
  return data as Address | undefined;
}

export interface AdminAccess {
  connected: boolean;
  account?: Address;
  governance?: Address;
  routerOwner?: Address;
  /** Connected wallet holds governance rights on the registry/automation. */
  isGovernance: boolean;
  /** Connected wallet owns the SwapRouter (treasury controls). */
  isRouterOwner: boolean;
  /** Has access to at least one section. */
  isAuthorized: boolean;
}

/** Resolves what the connected wallet is allowed to do in the admin dashboard. */
export function useAdminAccess(): AdminAccess {
  const { address, isConnected } = useAccount();
  const governance = useGovernanceAddress();
  const routerOwner = useRouterOwner();
  const isGovernance = eq(address, governance);
  const isRouterOwner = eq(address, routerOwner);
  return {
    connected: isConnected,
    account: address,
    governance,
    routerOwner,
    isGovernance,
    isRouterOwner,
    isAuthorized: isGovernance || isRouterOwner,
  };
}

export interface RegistrySettings {
  managementFeeBps?: bigint;
  protocolShareBps?: bigint;
  creatorShareBps?: bigint;
  minFirstDepositUsdg?: bigint;
  maxConstituents?: bigint;
  minWeightBps?: bigint;
  oracleStalenessSecs?: bigint;
  minRebalanceTradeSizeUsdg?: bigint;
  maxSwapSlippageBps?: bigint;
  minAUMUsdg?: bigint;
  protocolTreasury?: Address;
  swapRouter?: Address;
  basketFactory?: Address;
  automationContract?: Address;
  governance?: Address;
  pendingGovernance?: Address;
  paused?: boolean;
}

const REGISTRY_READ_ORDER = [
  "managementFeeBps",
  "protocolShareBps",
  "creatorShareBps",
  "minFirstDepositUsdg",
  "maxConstituents",
  "minWeightBps",
  "oracleStalenessSecs",
  "minRebalanceTradeSizeUsdg",
  "maxSwapSlippageBps",
  "minAUMUsdg",
  "protocolTreasury",
  "swapRouter",
  "basketFactory",
  "automationContract",
  "governance",
  "pendingGovernance",
  "paused",
] as const;

/** Reads every current registry setting for form prefill. Tolerates getters the
   deployment may not expose (allowFailure) — missing ones come back undefined. */
export function useRegistrySettings() {
  const isMock = useDataSource() === "mock";
  const { data, refetch, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: REGISTRY_READ_ORDER.map((functionName) => ({
      address: CONTRACTS.registry,
      abi: REGISTRY_ADMIN,
      functionName,
    })),
    query: { staleTime: 30_000, enabled: !isMock },
  });

  const settings = useMemo<RegistrySettings>(() => {
    const out: Record<string, unknown> = {};
    REGISTRY_READ_ORDER.forEach((name, i) => {
      const r = data?.[i];
      if (r && r.status === "success") out[name] = r.result;
    });
    return out as RegistrySettings;
  }, [data]);

  if (isMock) return { settings: MOCK_REGISTRY, refetch, isLoading: false };
  return { settings, refetch, isLoading };
}

export interface AutomationSettings {
  batchSize?: bigint;
  maxRebalanceSlippageBps?: bigint;
}

export function useAutomationSettings() {
  const isMock = useDataSource() === "mock";
  const { data, refetch } = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: CONTRACTS.automation, abi: AUTOMATION, functionName: "batchSize" },
      { address: CONTRACTS.automation, abi: AUTOMATION, functionName: "maxRebalanceSlippageBps" },
    ],
    query: { staleTime: 30_000, enabled: !isMock },
  });
  if (isMock) return { settings: MOCK_AUTOMATION, refetch };
  const settings: AutomationSettings = {
    batchSize: data?.[0]?.status === "success" ? (data[0].result as bigint) : undefined,
    maxRebalanceSlippageBps:
      data?.[1]?.status === "success" ? (data[1].result as bigint) : undefined,
  };
  return { settings, refetch };
}

export function useRouterSpread() {
  const isMock = useDataSource() === "mock";
  const { data, refetch } = useReadContract({
    address: CONTRACTS.swapRouter,
    abi: SWAP_ROUTER,
    functionName: "spreadBps",
    query: { staleTime: 30_000, enabled: !isMock },
  });
  if (isMock) return { spreadBps: MOCK_SPREAD, refetch };
  return { spreadBps: data as bigint | undefined, refetch };
}
