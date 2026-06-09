import type {
  ApiBasketDetail,
  ApiBasketSummary,
  ApiCatalogueAsset,
  ApiComposeResponse,
  ApiCreatorDashboard,
  ApiCreatorTokenHistory,
  ApiInvestorPosition,
  ApiNavPoint,
  ApiPortfolio,
  ApiPrice,
} from "./types";

const PUBLIC_FALLBACK = "https://weave.up.railway.app";

/**
 * Resolve the backend base URL for the current execution context.
 *
 * - Default: the public backend URL (browser fetches it directly, unchanged).
 * - Private-networking mode: set NEXT_PUBLIC_BACKEND_URL="/be". The browser then
 *   calls this app's own origin (/be/*), which next.config rewrites to
 *   BACKEND_INTERNAL_URL over Railway's private network. A relative base has no
 *   origin server-side, so server-rendered calls use BACKEND_INTERNAL_URL directly.
 */
function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL ?? PUBLIC_FALLBACK;
  if (configured.startsWith("/")) {
    if (typeof window === "undefined") {
      return process.env.BACKEND_INTERNAL_URL ?? PUBLIC_FALLBACK;
    }
    return configured;
  }
  return configured;
}

const BASE_URL = resolveBaseUrl();

/** Error thrown for any non-2xx API response, carrying the backend's
   `{ error, code }` message where available. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiRequestError("Network error — could not reach the Weave API.", 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: number | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: number };
      if (body.error) message = body.error;
      code = body.code;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiRequestError(message, res.status, code);
  }

  return res.json() as Promise<T>;
}

/** Typed Weave backend client. One function per OpenAPI operation. */
export const weaveApi = {
  catalogue: () => get<ApiCatalogueAsset[]>("/catalogue"),
  catalogueAsset: (address: string) =>
    get<ApiCatalogueAsset>(`/catalogue/${address}`),
  prices: () => get<ApiPrice[]>("/prices"),

  baskets: () => get<ApiBasketSummary[]>("/baskets"),
  basket: (address: string) => get<ApiBasketDetail>(`/baskets/${address}`),
  performance: (address: string) =>
    get<ApiNavPoint[]>(`/baskets/${address}/performance`),
  basketPosition: (address: string, wallet: string) =>
    get<ApiInvestorPosition>(`/baskets/${address}/positions/${wallet}`),

  positions: (wallet: string) => get<ApiPortfolio>(`/positions/${wallet}`),
  creator: (wallet: string) => get<ApiCreatorDashboard>(`/creator/${wallet}`),
  creatorTokenHistory: (address: string) =>
    get<ApiCreatorTokenHistory>(`/creator-tokens/${address}`),

  compose: (thesis: string) =>
    get<ApiComposeResponse>("/ai/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thesis }),
    }),
};
