// Minimal human-readable ABIs covering exactly the functions/events the Weave
// frontend calls (per "Weave — Frontend Contract Integration Reference.md").
// viem parses these `as const` string fragments into fully-typed ABIs.
//
// When the real forge-generated JSON ABIs are committed, swap these out — the
// call sites use functionName strings so they remain compatible.

// Custom errors the contracts revert with — included so viem can decode a
// revert's selector into a named error (otherwise we only get the raw 4-byte
// signature). Signatures verified from the Frontend Integration Specification §6.
export const contractErrors = [
  // BasketFactory
  "error TooFewConstituents(uint256 count)",
  "error TooManyConstituents(uint256 count, uint256 max)",
  "error ArrayLengthMismatch()",
  "error WeightSumInvalid(uint256 sum)",
  "error WeightTooLow(address asset, uint256 weight)",
  "error WeightTooHigh(address asset, uint256 weight)",
  "error InitialDepositTooLow(uint256 provided, uint256 required)",
  "error InvalidDriftThreshold()",
  "error DuplicateConstituent(address asset)",
  // BasketImplementation
  "error BasketSuspended()",
  "error ProtocolPaused()",
  "error RebalancingNotEnabled()",
  "error DriftThresholdNotMet()",
  "error InsufficientSlippage()",
  "error ZeroAmount()",
  // WeaveRegistry
  "error StalePrice(address asset)",
  "error NegativePrice(address asset)",
  "error AssetNotActive(address asset)",
  "error AssetNotFound(address asset)",
  "error InvalidFeeBps()",
  "error InvalidFeeSplit()",
  "error InvalidParameter()",
  // CreatorToken
  "error AlreadyClaimed(address account, uint256 snapshotId)",
  "error SnapshotDoesNotExist(uint256 snapshotId)",
  "error NothingToClaim()",
  "error InsufficientBalance(uint256 available, uint256 required)",
  // SwapRouter (surfaces through deposit/redeem/rebalance)
  "error InsufficientLiquidity(address asset, uint256 requested, uint256 available)",
  "error InsufficientOutput(uint256 output, uint256 minOutput)",
] as const;

export const registryAbi = [
  "function managementFeeBps() view returns (uint256)",
  "function protocolShareBps() view returns (uint256)",
  "function creatorShareBps() view returns (uint256)",
  "function minFirstDepositUsdg() view returns (uint256)",
  "function maxConstituents() view returns (uint256)",
  "function minWeightBps() view returns (uint256)",
  "function oracleStalenessSecs() view returns (uint256)",
  "function paused() view returns (bool)",
  "function isBasket(address) view returns (bool)",
] as const;

export const erc20Abi = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

export const basketAbi = [
  // reads
  "function balanceOf(address account) view returns (uint256)",
  "function navPerToken() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function totalValueUsdg() view returns (uint256)",
  "function needsRebalancing() view returns (bool)",
  "function maxDrift() view returns (uint256)",
  "function rebalancingEnabled() view returns (bool)",
  "function suspended() view returns (bool)",
  "function constituents() view returns (address[])",
  "function basketState() view returns (address[] constituents, uint256[] targetWeights, uint256[] currentWeights, uint256[] balances, uint256 totalValue, uint256 nav, bool rebalancingEnabled, uint256 driftThresholdBps, uint256 maxDrift)",
  // writes
  "function deposit(uint256 usdgAmount, uint256 minBasketTokensOut, address receiver)",
  "function redeem(uint256 basketTokenAmount, uint256 minUsdgOut, address receiver)",
  "function rebalance(uint256[] minAmountsOut)",
  // events
  "event Deposited(address indexed investor, uint256 usdgAmount, uint256 basketTokensMinted, uint256 feeUsdg)",
  "event Redeemed(address indexed investor, uint256 basketTokensBurned, uint256 usdgReturned, uint256 feeUsdg)",
  "event Rebalanced(address indexed triggeredBy)",
  ...contractErrors,
] as const;

export const factoryAbi = [
  "function createBasket(string name, string symbol, string thesis, address[] constituents, uint256[] targetWeightsBps, bool rebalancingEnabled, uint256 driftThresholdBps, uint256 initialDepositUsdg)",
  // 9-arg signature per Frontend Integration Specification §12 (was 5 args).
  "event BasketCreated(address indexed basket, address indexed creatorToken, address indexed creator, string name, string symbol, string thesis, address[] constituents, uint256[] targetWeightsBps, bool rebalancingEnabled)",
  ...contractErrors,
] as const;

export const creatorTokenAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function claimableRevenue(address account, uint256 snapshotId) view returns (uint256)",
  "function snapshotCount() view returns (uint256)",
  "function redeemableOnBurn(uint256 amount) view returns (uint256)",
  "function claim(uint256 snapshotId)",
  "function claimAll()",
  "function burn(uint256 amount)",
  "event RevenueClaimed(address indexed account, uint256 indexed snapshotId, uint256 usdgAmount)",
] as const;
