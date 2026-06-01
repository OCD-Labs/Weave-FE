import { Marketplace } from "@/components/marketplace/Marketplace";
import { BASKETS, SECTORS, TOTAL_AUM } from "@/lib/data";

export default function MarketplacePage() {
  return <Marketplace baskets={BASKETS} sectors={SECTORS} totalAum={TOTAL_AUM} />;
}
