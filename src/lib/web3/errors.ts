import { BaseError, ContractFunctionRevertedError } from "viem";

// Maps the contracts' custom revert errors to user-facing messages
// (per the integration reference §Error Handling).
const ERROR_MESSAGES: Record<string, string> = {
  BasketSuspended: "This basket is suspended and cannot accept deposits.",
  InsufficientSlippage: "Price moved too much during execution. Please try again.",
  StalePrice: "Price data is temporarily unavailable. Please try again.",
  WeightSumInvalid: "Constituent weights must sum to exactly 100%.",
  MinDepositNotMet: "Deposit amount is below the minimum required.",
  RebalancingNotEnabled: "This basket does not have rebalancing enabled.",
  DriftThresholdNotMet: "This basket does not currently need rebalancing.",
  TooFewConstituents: "A basket needs at least 3 constituents.",
  TooManyConstituents: "Maximum constituents exceeded.",
  WeightTooLow: "Each constituent must have at least 1% weight.",
  WeightTooHigh: "No single constituent can exceed 50% weight.",
  DuplicateConstituent: "Duplicate constituent in basket composition.",
  InvalidDriftThreshold: "Drift threshold must be between 1% and 50%.",
  AlreadyClaimed: "You have already claimed this snapshot.",
  NothingToClaim: "No claimable revenue for your current balance.",
  ZeroAmount: "Amount cannot be zero.",
};

/** Turn any thrown contract/wallet error into a friendly message. */
export function decodeContractError(err: unknown): string {
  if (err instanceof BaseError) {
    // User rejected the signature in their wallet.
    const msg = err.shortMessage ?? err.message;
    if (/rejected|denied|user cancel/i.test(msg)) {
      return "Transaction cancelled.";
    }
    // Decode a known custom error name → message.
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];
      if (name) return `Transaction failed: ${name}.`;
    }
    if (/insufficient funds/i.test(msg)) {
      return "Insufficient funds to cover gas. Top up your wallet and try again.";
    }
    return msg || "Transaction failed.";
  }
  if (err instanceof Error) return err.message;
  return "Transaction failed.";
}
