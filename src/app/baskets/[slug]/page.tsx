import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BasketDetail } from "@/components/basket/BasketDetail";
import { BASKETS, getBasketBySlug } from "@/lib/data";

export function generateStaticParams() {
  return BASKETS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const basket = getBasketBySlug(slug);
  if (!basket) return { title: "Basket not found — Weave" };
  return {
    title: `${basket.name} (${basket.symbol}) — Weave`,
    description: basket.thesis,
  };
}

export default async function BasketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const basket = getBasketBySlug(slug);
  if (!basket) notFound();

  return <BasketDetail basket={basket} />;
}
