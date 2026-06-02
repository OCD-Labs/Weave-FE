import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { robinhoodChainTestnet } from "./chain";

// WalletConnect projectId (required for the WalletConnect option). Get one at
// https://cloud.reown.com. A placeholder keeps the app working with injected
// wallets (MetaMask, Phantom, etc.) even before it's set.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "WEAVE_DEV_PLACEHOLDER";

/** wagmi + RainbowKit config. getDefaultConfig wires the standard multi-wallet
   set — MetaMask, Rainbow, Coinbase Wallet, WalletConnect, and injected
   browser wallets (Phantom's EVM provider included) — plus an HTTP transport
   for Robinhood Chain Testnet. */
export const wagmiConfig = getDefaultConfig({
  appName: "Weave",
  projectId,
  chains: [robinhoodChainTestnet],
  transports: {
    [robinhoodChainTestnet.id]: http(),
  },
  ssr: true,
});
