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

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://weave.up.railway.app";

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
