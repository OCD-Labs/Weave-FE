"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { weaveApi } from "./client";

// Query keys — centralized so invalidation stays consistent.
export const qk = {
  catalogue: ["catalogue"] as const,
  prices: ["prices"] as const,
  baskets: ["baskets"] as const,
  basket: (address: string) => ["basket", address] as const,
  performance: (address: string) => ["performance", address] as const,
  basketPosition: (address: string, wallet: string) =>
    ["basketPosition", address, wallet] as const,
  positions: (wallet: string) => ["positions", wallet] as const,
  creator: (wallet: string) => ["creator", wallet] as const,
  creatorTokenHistory: (address: string) => ["creatorTokenHistory", address] as const,
};

export function useCatalogue() {
  return useQuery({ queryKey: qk.catalogue, queryFn: weaveApi.catalogue });
}

export function usePrices() {
  return useQuery({
    queryKey: qk.prices,
    queryFn: weaveApi.prices,
    refetchInterval: 60_000, // oracle prices update ~60s
  });
}

export function useBaskets() {
  return useQuery({ queryKey: qk.baskets, queryFn: weaveApi.baskets });
}

export function useBasket(address: string) {
  return useQuery({
    queryKey: qk.basket(address),
    queryFn: () => weaveApi.basket(address),
    enabled: !!address,
    refetchInterval: 30_000, // live prices, per the integration reference
  });
}

export function usePerformance(address: string) {
  return useQuery({
    queryKey: qk.performance(address),
    queryFn: () => weaveApi.performance(address),
    enabled: !!address,
  });
}

export function useBasketPosition(address: string, wallet?: string) {
  return useQuery({
    queryKey: qk.basketPosition(address, wallet ?? ""),
    queryFn: () => weaveApi.basketPosition(address, wallet!),
    enabled: !!address && !!wallet,
  });
}

export function usePositions(wallet?: string) {
  return useQuery({
    queryKey: qk.positions(wallet ?? ""),
    queryFn: () => weaveApi.positions(wallet!),
    enabled: !!wallet,
  });
}

export function useCreator(wallet?: string) {
  return useQuery({
    queryKey: qk.creator(wallet ?? ""),
    queryFn: () => weaveApi.creator(wallet!),
    enabled: !!wallet,
  });
}

export function useCreatorTokenHistory(address?: string) {
  return useQuery({
    queryKey: qk.creatorTokenHistory(address ?? ""),
    queryFn: () => weaveApi.creatorTokenHistory(address!),
    enabled: !!address,
  });
}

/** AI basket composition — POST /ai/compose. Mutation: triggered on submit. */
export function useComposeBasket() {
  return useMutation({
    mutationFn: (thesis: string) => weaveApi.compose(thesis),
  });
}
