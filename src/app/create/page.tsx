import type { Metadata } from "next";
import { CreateBasket } from "@/components/create/CreateBasket";

export const metadata: Metadata = {
  title: "Create an index — Weave",
  description:
    "Describe your investment thesis and let the AI composition engine propose an index of tokenized stocks to publish onchain.",
};

export default function CreatePage() {
  return <CreateBasket />;
}
