"use client";

import { type ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Web3Providers } from "./Web3Providers";

interface WalletContextValue {
  connected: boolean;
  /** Shortened wallet address for display, or "" when disconnected. */
  address: string;
  /** Full checksummed address, or undefined when disconnected. */
  fullAddress: `0x${string}` | undefined;
  /** Open the multi-wallet connect modal. */
  connect: () => void;
  disconnect: () => void;
}

function shorten(addr?: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * useWallet — the app-wide wallet hook every screen already uses. It now reads
 * real state from wagmi and opens the RainbowKit multi-wallet modal, while
 * keeping the same surface (connected / address / connect / disconnect) the
 * mock version had, so no screen needed to change.
 */
export function useWallet(): WalletContextValue {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  return {
    connected: isConnected,
    address: shorten(address),
    fullAddress: address,
    connect: () => openConnectModal?.(),
    disconnect: () => disconnect(),
  };
}

/** Mounts the web3 provider stack (wagmi + react-query + RainbowKit). Kept as
   <WalletProvider> so layout.tsx and the provider tree read the same. The
   `address` prop from the old mock API is ignored — addresses come from the
   connected wallet now. */
export function WalletProvider({ children }: { address?: string; children: ReactNode }) {
  return <Web3Providers>{children}</Web3Providers>;
}
