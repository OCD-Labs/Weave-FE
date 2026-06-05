import type { Metadata } from "next";
import { Marketplace } from "@/components/marketplace/Marketplace";

export const metadata: Metadata = {
  title: "Markets — Weave",
  description: "Browse every published basket of tokenized stocks on Weave.",
};

export default function MarketsPage() {
  return <Marketplace />;
}
