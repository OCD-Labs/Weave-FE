import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/toast/ToastProvider";

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
  title: "Weave — Onchain index protocol",
  description:
    "Compose a thematic basket of tokenized equities, publish it onchain, and earn a continuous share of its revenue for as long as investors hold it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables go on <html> so they're in scope for Tailwind v4's
    // preflight `font-family` (set on <html>) and every descendant — putting
    // them on <body> leaves <html> resolving an undefined var → serif fallback.
    <html lang="en" className={`${hanken.variable} ${plexMono.variable}`}>
      <body>
        <ToastProvider>
          <div className="app">
            <Nav />
            {children}
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
