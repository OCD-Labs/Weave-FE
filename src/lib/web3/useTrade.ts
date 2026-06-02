"use client";

import { useCallback, useState } from "react";
import { parseAbi, type Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { basketAbi, erc20Abi as erc20Strings } from "./abis";
import { CONTRACTS } from "./addresses";
import { decodeContractError } from "./errors";

const ERC20 = parseAbi(erc20Strings);
const BASKET = parseAbi(basketAbi);

const SLIPPAGE_BPS = 500n; // 5% per the integration reference

export type TradePhase =
  | "idle"
  | "approving"
  | "depositing"
  | "redeeming"
  | "confirming"
  | "success"
  | "error";

export interface TradeState {
  phase: TradePhase;
  error?: string;
  approvalTx?: Address;
  tradeTx?: Address;
}

/** Deposit (two-tx: approve USDG → deposit) and redeem (single-tx) for a basket,
   with 5% slippage protection computed from live on-chain state. */
export function useTrade(basket: Address) {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<TradeState>({ phase: "idle" });

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  /** Deposit `usdgRaw` (6-dp) into the basket. */
  const deposit = useCallback(
    async (usdgRaw: bigint) => {
      if (!account || !publicClient) {
        setState({ phase: "error", error: "Connect your wallet to continue." });
        return;
      }
      try {
        // Estimate basket tokens out for slippage floor.
        const [nav, supply, totalValue, feeBps] = await Promise.all([
          publicClient.readContract({ address: basket, abi: BASKET, functionName: "navPerToken" }) as Promise<bigint>,
          publicClient.readContract({ address: basket, abi: BASKET, functionName: "totalSupply" }) as Promise<bigint>,
          publicClient.readContract({ address: basket, abi: BASKET, functionName: "totalValueUsdg" }) as Promise<bigint>,
          readFeeBps(publicClient),
        ]);
        void nav;

        const netUsdg = usdgRaw - (usdgRaw * feeBps) / 10_000n;
        // First depositor: 1 USDG (6-dp) → 1 token (18-dp), i.e. ×1e12.
        const estTokens =
          supply === 0n ? netUsdg * 1_000_000_000_000n : (netUsdg * supply) / (totalValue || 1n);
        const minTokensOut = (estTokens * (10_000n - SLIPPAGE_BPS)) / 10_000n;

        // Approve USDG to the basket if needed.
        const allowance = (await publicClient.readContract({
          address: CONTRACTS.usdg,
          abi: ERC20,
          functionName: "allowance",
          args: [account, basket],
        })) as bigint;

        if (allowance < usdgRaw) {
          setState({ phase: "approving" });
          const approvalTx = await writeContractAsync({
            address: CONTRACTS.usdg,
            abi: ERC20,
            functionName: "approve",
            args: [basket, usdgRaw],
          });
          setState({ phase: "approving", approvalTx });
          await publicClient.waitForTransactionReceipt({ hash: approvalTx });
        }

        setState((s) => ({ ...s, phase: "depositing" }));
        const depositArgs = {
          address: basket,
          abi: BASKET,
          functionName: "deposit" as const,
          account,
          args: [usdgRaw, minTokensOut, account] as const,
        };
        await publicClient.simulateContract(depositArgs);
        const tradeTx = await writeContractAsync(depositArgs);
        setState((s) => ({ ...s, phase: "confirming", tradeTx }));
        await publicClient.waitForTransactionReceipt({ hash: tradeTx });
        setState((s) => ({ ...s, phase: "success" }));
      } catch (err) {
        setState({ phase: "error", error: decodeContractError(err) });
      }
    },
    [account, publicClient, writeContractAsync, basket]
  );

  /** Redeem `tokenRaw` (18-dp) basket tokens for USDG. Single tx, no approval. */
  const redeem = useCallback(
    async (tokenRaw: bigint) => {
      if (!account || !publicClient) {
        setState({ phase: "error", error: "Connect your wallet to continue." });
        return;
      }
      try {
        const [nav, feeBps] = await Promise.all([
          publicClient.readContract({ address: basket, abi: BASKET, functionName: "navPerToken" }) as Promise<bigint>,
          readFeeBps(publicClient),
        ]);
        const grossUsdg = (tokenRaw * nav) / 10n ** 18n;
        const netUsdg = grossUsdg - (grossUsdg * feeBps) / 10_000n;
        const minUsdgOut = (netUsdg * (10_000n - SLIPPAGE_BPS)) / 10_000n;

        setState({ phase: "redeeming" });
        const redeemArgs = {
          address: basket,
          abi: BASKET,
          functionName: "redeem" as const,
          account,
          args: [tokenRaw, minUsdgOut, account] as const,
        };
        await publicClient.simulateContract(redeemArgs);
        const tradeTx = await writeContractAsync(redeemArgs);
        setState({ phase: "confirming", tradeTx });
        await publicClient.waitForTransactionReceipt({ hash: tradeTx });
        setState({ phase: "success", tradeTx });
      } catch (err) {
        setState({ phase: "error", error: decodeContractError(err) });
      }
    },
    [account, publicClient, writeContractAsync, basket]
  );

  return { state, deposit, redeem, reset };
}

export type RebalancePhase = "idle" | "rebalancing" | "confirming" | "success" | "error";

/** Permissionless rebalance() — anyone can call; caller pays gas. Reads the
   constituents to size the minAmountsOut array (zeros; MockSwapRouter prices
   at oracle rates on testnet). */
export function useRebalance(basket: Address) {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [phase, setPhase] = useState<RebalancePhase>("idle");
  const [error, setError] = useState<string>();

  const rebalance = useCallback(async () => {
    if (!account || !publicClient) {
      setPhase("error");
      setError("Connect your wallet to rebalance.");
      return;
    }
    try {
      const constituents = (await publicClient.readContract({
        address: basket,
        abi: BASKET,
        functionName: "constituents",
      })) as readonly Address[];
      const minAmountsOut = new Array(constituents.length).fill(0n);

      setPhase("rebalancing");
      const rebalanceArgs = {
        address: basket,
        abi: BASKET,
        functionName: "rebalance" as const,
        account,
        args: [minAmountsOut] as const,
      };
      await publicClient.simulateContract(rebalanceArgs);
      const tx = await writeContractAsync(rebalanceArgs);
      setPhase("confirming");
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setPhase("success");
    } catch (err) {
      setError(decodeContractError(err));
      setPhase("error");
    }
  }, [account, publicClient, writeContractAsync, basket]);

  const busy = phase === "rebalancing" || phase === "confirming";
  return { phase, error, busy, rebalance };
}

// Registry management fee (bps) — read lazily; defaults to 50 (0.5%) on failure.
async function readFeeBps(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>
): Promise<bigint> {
  try {
    const v = (await publicClient.readContract({
      address: CONTRACTS.registry,
      abi: parseAbi(["function managementFeeBps() view returns (uint256)"]),
      functionName: "managementFeeBps",
    })) as bigint;
    return v;
  } catch {
    return 50n;
  }
}
