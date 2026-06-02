"use client";

import { useCallback, useState } from "react";
import { decodeEventLog, parseAbi, type Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { erc20Abi as erc20Strings, factoryAbi } from "./abis";
import { CONTRACTS } from "./addresses";
import { decodeContractError } from "./errors";

const ERC20 = parseAbi(erc20Strings);
const FACTORY = parseAbi(factoryAbi);

export type DeployPhase =
  | "idle"
  | "approving" // waiting for USDG approval signature/confirmation
  | "approved"
  | "deploying" // waiting for createBasket signature/confirmation
  | "confirming" // mined, waiting for BasketCreated / receipt
  | "success"
  | "error";

export interface DeployState {
  phase: DeployPhase;
  error?: string;
  /** New basket address once BasketCreated is parsed. */
  basketAddress?: Address;
  approvalTx?: Address;
  deployTx?: Address;
  /** True once the USDG allowance is sufficient (approved this run or already
     set from a prior attempt). Distinguishes "approval failed" from "deploy
     failed" in the status tracker. */
  approved?: boolean;
}

export interface CreateBasketArgs {
  name: string;
  symbol: string;
  thesis: string;
  constituents: Address[];
  targetWeightsBps: number[];
  rebalancingEnabled: boolean;
  driftThresholdBps: number;
  initialDepositRaw: bigint; // 6-dp USDG
}

/** Drives the two-tx deploy: USDG approve (if needed) → factory.createBasket →
   parse BasketCreated for the new address. Each phase surfaces in `state` so
   the UI can render a TransactionStatus tracker. */
export function useCreateBasket() {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<DeployState>({ phase: "idle" });

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  const deploy = useCallback(
    async (args: CreateBasketArgs) => {
      if (!account || !publicClient) {
        setState({ phase: "error", error: "Connect your wallet to deploy." });
        return;
      }
      try {
        // 1) Approve USDG to the factory if the allowance is insufficient.
        const allowance = (await publicClient.readContract({
          address: CONTRACTS.usdg,
          abi: ERC20,
          functionName: "allowance",
          args: [account, CONTRACTS.factory],
        })) as bigint;

        let approvalTx: Address | undefined;
        if (allowance < args.initialDepositRaw) {
          setState({ phase: "approving" });
          approvalTx = await writeContractAsync({
            address: CONTRACTS.usdg,
            abi: ERC20,
            functionName: "approve",
            args: [CONTRACTS.factory, args.initialDepositRaw],
          });
          setState({ phase: "approving", approvalTx });
          await publicClient.waitForTransactionReceipt({ hash: approvalTx });
        }
        // Allowance is now sufficient (approved this run or already set).
        setState({ phase: "approved", approvalTx, approved: true });

        // 2) Deploy the basket.
        setState((s) => ({ ...s, phase: "deploying" }));
        const createArgs = {
          address: CONTRACTS.factory,
          abi: FACTORY,
          functionName: "createBasket" as const,
          account,
          args: [
            args.name,
            args.symbol,
            args.thesis,
            args.constituents,
            args.targetWeightsBps.map((w) => BigInt(w)),
            args.rebalancingEnabled,
            BigInt(args.driftThresholdBps),
            args.initialDepositRaw,
          ] as const,
        };
        // Pre-simulation implemeted in next line to surface errors (e.g. validation, insufficient funds) before prompting the user to sign.
        await publicClient.simulateContract(createArgs);
        const deployTx = await writeContractAsync(createArgs);
        setState((s) => ({ ...s, phase: "confirming", deployTx }));

        const receipt = await publicClient.waitForTransactionReceipt({ hash: deployTx });

        // 3) Parse BasketCreated for the new basket address.
        const created = receipt.logs
          .map((log) => {
            try {
              return parseBasketCreated(log.topics, log.data);
            } catch {
              return null;
            }
          })
          .find(Boolean);

        setState({
          phase: "success",
          deployTx,
          basketAddress: created?.basket,
        });
      } catch (err) {
        // Preserve prior progress (e.g. `approved`) so the status tracker flags
        // the correct failed step.
        setState((s) => ({ ...s, phase: "error", error: decodeContractError(err) }));
      }
    },
    [account, publicClient, writeContractAsync]
  );

  return { state, deploy, reset };
}

// Decode the BasketCreated event from a raw log via the parsed factory ABI.
function parseBasketCreated(
  topics: readonly `0x${string}`[],
  data: `0x${string}`
): { basket: Address } | null {
  const decoded = decodeEventLog({
    abi: FACTORY,
    eventName: "BasketCreated",
    topics: topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
    data,
  });
  const basket = (decoded.args as { basket?: Address }).basket;
  return basket ? { basket } : null;
}
