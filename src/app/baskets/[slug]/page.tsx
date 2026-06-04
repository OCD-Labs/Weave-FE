import type { Metadata } from "next";
import { BasketDetailView } from "@/components/basket/BasketDetailView";

export const metadata: Metadata = {
  title: "Basket — Weave",
  description: "Basket composition, performance, and deposit/redeem on Weave.",
};

export default async function BasketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BasketDetailView slug={slug} />;
}
