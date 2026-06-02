"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "@/lib/web3/wagmi";

// Match RainbowKit's modal to the Weave teal accent + radii.
const weaveTheme = lightTheme({
  accentColor: "hsl(178 70% 36%)",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  fontStack: "system",
});

export function Web3Providers({ children }: { children: ReactNode }) {
  // One QueryClient per app instance (kept stable across renders).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={weaveTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
