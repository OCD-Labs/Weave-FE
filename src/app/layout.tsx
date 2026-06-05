import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { DataSourceToggle } from "@/components/dev/DataSourceToggle";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Weave — Onchain basket protocol",
  description:
    "Compose a thematic basket of tokenized stocks, publish it onchain, and earn a continuous share of its revenue for as long as investors hold it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${hanken.variable} ${plexMono.variable}`}
    >
      <body>
        <WalletProvider>
          <ToastProvider>
            <div className="app">
              <Nav />
              {children}
              <Footer />
            </div>
            <DataSourceToggle />
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
