import type { Metadata } from "next";
import { Portfolio } from "@/components/account/Portfolio";

export const metadata: Metadata = {
  title: "Portfolio — Weave",
  description: "Your basket positions, cost basis, and unrealised performance across Weave.",
};

export default function PortfolioPage() {
  return <Portfolio />;
}
