// Conversions from on-chain / API string big-integers to display numbers.
// Per the integration reference: never parseFloat a raw uint256; divide by the
// token's decimals as the final display step only.

export const USDG_DECIMALS = 6;
export const TOKEN_DECIMALS = 18; // basket + creator tokens
export const NAV_DECIMALS = 18;
export const ORACLE_PRICE_DECIMALS = 8; // catalogue/oracle prices

/** Convert a string/bigint base-unit amount to a JS number for display.
   Safe for UI magnitudes (USD, token counts); not for further arithmetic. */
export function fromUnits(value: string | bigint, decimals: number): number {
  const v = typeof value === "bigint" ? value : BigInt(value || "0");
  const negative = v < 0n;
  const abs = negative ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  // Keep up to 6 fractional digits of precision for the Number conversion.
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6);
  const num = Number(`${whole}.${fracStr}`);
  return negative ? -num : num;
}

/** USDG (6-dp) string → USD number. */
export const usdgToNumber = (v: string | bigint) => fromUnits(v, USDG_DECIMALS);

/** NAV-per-token (18-dp) string → USD-per-token number. */
export const navToNumber = (v: string | bigint) => fromUnits(v, NAV_DECIMALS);

/** Basket/creator token (18-dp) string → token-count number. */
export const tokensToNumber = (v: string | bigint) => fromUnits(v, TOKEN_DECIMALS);

/** Parse a human decimal string (e.g. "1000.50") into base units BigInt. */
export function toUnits(value: string, decimals: number): bigint {
  const [whole = "0", frac = ""] = value.trim().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}
