"use client";

import { useSyncExternalStore } from "react";

// Dev-only toggle to flip the Marketplace between the live backend (GET /baskets)
// and the bundled mock baskets. Handy while the testnet has no deployed baskets.
//
// Default source: env NEXT_PUBLIC_DATA_SOURCE ("mock" | "live"), falling back to
// "live". The in-page switch overrides it at runtime (persisted to localStorage).

export type DataSource = "live" | "mock";

const STORAGE_KEY = "weave:dataSource";
const DEFAULT: DataSource =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "mock" ? "mock" : "live";

/** Whether the dev toggle UI should be shown at all. */
export const DATA_TOGGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DATA_TOGGLE === "1";

const listeners = new Set<() => void>();
let override: DataSource | null = null;

function read(): DataSource {
  if (override) return override;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "mock" || stored === "live") return stored;
  }
  return DEFAULT;
}

export function setDataSource(next: DataSource) {
  override = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Reactive hook returning the active data source. SSR-safe (defaults on server). */
export function useDataSource(): DataSource {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}
