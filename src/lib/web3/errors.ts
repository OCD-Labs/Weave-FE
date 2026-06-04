import { BaseError, ContractFunctionRevertedError, toFunctionSelector } from "viem";

// Maps the contracts' custom revert errors to user-facing messages
// (Frontend Integration Specification §6 — verified from Solidity source).
const ERROR_MESSAGES: Record<string, string> = {
  // BasketFactory
  TooFewConstituents: "A basket needs at least 3 constituents.",
  TooManyConstituents: "Maximum number of constituents exceeded.",
  ArrayLengthMismatch: "Constituent and weight arrays must be the same length.",
  WeightSumInvalid: "Constituent weights must sum to exactly 100%.",
  WeightTooLow: "Each constituent must have at least 1% weight.",
  WeightTooHigh: "No single constituent can exceed 50% weight.",
  AssetNotActive: "One or more constituents are not active in the catalogue.",
  InitialDepositTooLow: "Initial deposit is below the minimum required.",
  InvalidDriftThreshold: "Drift threshold must be between 1 and 5000 bps (0.01%–50%).",
  DuplicateConstituent: "Duplicate constituent found in basket composition.",
  // BasketImplementation
  BasketSuspended: "This basket is suspended and cannot accept deposits or redemptions.",
  ProtocolPaused: "The protocol is temporarily paused. Please try again later.",
  RebalancingNotEnabled: "This basket does not have auto-rebalancing enabled.",
  DriftThresholdNotMet: "This basket does not currently need rebalancing.",
  InsufficientSlippage: "Price moved too much during execution. Please try again.",
  ZeroAmount: "Amount cannot be zero.",
  // WeaveRegistry
  StalePrice: "Price data is temporarily unavailable. Please try again.",
  NegativePrice: "Invalid price data from oracle. Please try again.",
  AssetNotFound: "Asset not found in the catalogue.",
  InvalidFeeBps: "Fee exceeds the maximum allowed (10%).",
  InvalidFeeSplit: "Fee split is invalid.",
  InvalidParameter: "Invalid parameter value.",
  // CreatorToken
  AlreadyClaimed: "You have already claimed this snapshot.",
  SnapshotDoesNotExist: "This snapshot does not exist.",
  NothingToClaim: "No claimable revenue for your current creator token balance.",
  InsufficientBalance: "Insufficient creator token balance for this burn amount.",
  // SwapRouter
  InsufficientLiquidity:
    "Insufficient liquidity for this constituent. Please try a smaller deposit or try again later.",
  InsufficientOutput: "Swap output is below the minimum acceptable. Please try again.",
};

// Signatures used to derive 4-byte selectors, so we can name a revert even when
// the ABI in scope didn't include the error definition.
const ERROR_SIGNATURES: Record<string, string> = {
  TooFewConstituents: "TooFewConstituents(uint256)",
  TooManyConstituents: "TooManyConstituents(uint256,uint256)",
  ArrayLengthMismatch: "ArrayLengthMismatch()",
  WeightSumInvalid: "WeightSumInvalid(uint256)",
  WeightTooLow: "WeightTooLow(address,uint256)",
  WeightTooHigh: "WeightTooHigh(address,uint256)",
  AssetNotActive: "AssetNotActive(address)",
  InitialDepositTooLow: "InitialDepositTooLow(uint256,uint256)",
  InvalidDriftThreshold: "InvalidDriftThreshold()",
  DuplicateConstituent: "DuplicateConstituent(address)",
  BasketSuspended: "BasketSuspended()",
  ProtocolPaused: "ProtocolPaused()",
  RebalancingNotEnabled: "RebalancingNotEnabled()",
  DriftThresholdNotMet: "DriftThresholdNotMet()",
  InsufficientSlippage: "InsufficientSlippage()",
  ZeroAmount: "ZeroAmount()",
  StalePrice: "StalePrice(address)",
  NegativePrice: "NegativePrice(address)",
  AssetNotFound: "AssetNotFound(address)",
  InvalidFeeBps: "InvalidFeeBps()",
  InvalidFeeSplit: "InvalidFeeSplit()",
  InvalidParameter: "InvalidParameter()",
  AlreadyClaimed: "AlreadyClaimed(address,uint256)",
  SnapshotDoesNotExist: "SnapshotDoesNotExist(uint256)",
  NothingToClaim: "NothingToClaim()",
  InsufficientBalance: "InsufficientBalance(uint256,uint256)",
  InsufficientLiquidity: "InsufficientLiquidity(address,uint256,uint256)",
  InsufficientOutput: "InsufficientOutput(uint256,uint256)",
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
