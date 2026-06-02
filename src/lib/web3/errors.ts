import { BaseError, ContractFunctionRevertedError, toFunctionSelector } from "viem";

// Maps the contracts' custom revert errors to user-facing messages
// (per the integration reference §Error Handling).
const ERROR_MESSAGES: Record<string, string> = {
  BasketSuspended: "This basket is suspended and cannot accept deposits.",
  InsufficientSlippage: "Price moved too much during execution. Please try again.",
  StalePrice: "Price data is temporarily unavailable. Please try again later.",
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

// Signatures used to derive 4-byte selectors, so we can name a revert even when
// the ABI in scope didn't include the error definition.
const ERROR_SIGNATURES: Record<string, string> = {
  BasketSuspended: "BasketSuspended()",
  InsufficientSlippage: "InsufficientSlippage()",
  StalePrice: "StalePrice(address)",
  WeightSumInvalid: "WeightSumInvalid(uint256)",
  MinDepositNotMet: "MinDepositNotMet()",
  RebalancingNotEnabled: "RebalancingNotEnabled()",
  DriftThresholdNotMet: "DriftThresholdNotMet()",
  TooFewConstituents: "TooFewConstituents(uint256)",
  TooManyConstituents: "TooManyConstituents(uint256,uint256)",
  WeightTooLow: "WeightTooLow(address,uint256)",
  WeightTooHigh: "WeightTooHigh(address,uint256)",
  DuplicateConstituent: "DuplicateConstituent(address)",
  InvalidDriftThreshold: "InvalidDriftThreshold()",
  AlreadyClaimed: "AlreadyClaimed(address,uint256)",
  NothingToClaim: "NothingToClaim()",
  ZeroAmount: "ZeroAmount()",
};

// selector (0x........) → friendly message, computed once.
const SELECTOR_TO_MESSAGE: Record<string, string> = Object.fromEntries(
  Object.entries(ERROR_SIGNATURES).map(([name, sig]) => [
    toFunctionSelector(`function ${sig}`).toLowerCase(),
    ERROR_MESSAGES[name],
  ])
);

/** Turn any thrown contract/wallet error into a friendly message. */
export function decodeContractError(err: unknown): string {
  if (err instanceof BaseError) {
    // User rejected the signature in their wallet.
    const msg = err.shortMessage ?? err.message;
    if (/rejected|denied|user cancel/i.test(msg)) {
      return "Transaction cancelled.";
    }

    // 1) Decode a known custom error by name (works when the error is in the ABI).
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName ?? "";
      if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];
      // 1b) Fallback: match the raw selector embedded in the revert data.
      const raw = (revert.signature ?? revert.raw ?? "").toLowerCase();
      const bySig = SELECTOR_TO_MESSAGE[raw.slice(0, 10)];
      if (bySig) return bySig;
      if (name) return `Transaction failed: ${name}.`;
    }

    // 2) Last-resort: scan the whole error text for any known selector.
    const full = `${msg} ${err.message}`.toLowerCase();
    for (const [selector, friendly] of Object.entries(SELECTOR_TO_MESSAGE)) {
      if (full.includes(selector)) return friendly;
    }

    if (/insufficient funds/i.test(msg)) {
      return "Insufficient funds to cover gas. Top up your wallet and try again.";
    }
    return msg || "Transaction failed.";
  }
  if (err instanceof Error) {
    // Plain Error (e.g. from simulate) — scan text for a known selector.
    const text = err.message.toLowerCase();
    for (const [selector, friendly] of Object.entries(SELECTOR_TO_MESSAGE)) {
      if (text.includes(selector)) return friendly;
    }
    return err.message;
  }
  return "Transaction failed.";
}
