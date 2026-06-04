"use client";

import { useCallback, useState } from "react";
import { parseAbi, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { creatorTokenAbi } from "./abis";
import { decodeContractError } from "./errors";

const CREATOR_TOKEN = parseAbi(creatorTokenAbi);
const TOTAL_SUPPLY = 1_000_000n * 10n ** 18n;

/** Ownership % (creator-token balance / total supply) for the connected wallet.
   Read live from the contract per the spec — not provided by the API. */
export function useCreatorOwnership(creatorToken?: Address): number | null {
  const { address } = useAccount();
  const { data } = useReadContract({
    address: creatorToken,
    abi: CREATOR_TOKEN,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!creatorToken && !!address },
  });
  if (data === undefined) return null;
  const balance = data as bigint;
  return Number((balance * 10_000n) / TOTAL_SUPPLY) / 100; // percent
}

export type ClaimPhase = "idle" | "claiming" | "confirming" | "success" | "error";

/** claimAll() on a single creator token — sweeps all unclaimed snapshots. */
export function useClaimAll(creatorToken: Address) {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [phase, setPhase] = useState<ClaimPhase>("idle");
  const [error, setError] = useState<string>();

  const reset = useCallback(() => {
    setPhase("idle");
    setError(undefined);
  }, []);

  const claimAll = useCallback(async () => {
    if (!account || !publicClient) {
      setPhase("error");
      setError("Connect your wallet to claim.");
      return;
    }
    try {
      const args = {
        address: creatorToken,
        abi: CREATOR_TOKEN,
        functionName: "claimAll" as const,
        account,
      };
      await publicClient.simulateContract(args);
      setPhase("claiming");
      const tx = await writeContractAsync(args);
      setPhase("confirming");
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setPhase("success");
    } catch (err) {
      setError(decodeContractError(err));
      setPhase("error");
    }
  }, [account, publicClient, writeContractAsync, creatorToken]);

  const busy = phase === "claiming" || phase === "confirming";
  return { phase, error, busy, claimAll, reset };
}
