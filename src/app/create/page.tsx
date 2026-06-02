import type { Metadata } from "next";
import { CreateBasket } from "@/components/create/CreateBasket";

export const metadata: Metadata = {
  title: "Create a basket — Weave",
  description:
    "Describe your investment thesis and let the AI composition engine propose a basket of tokenized equities to publish onchain.",
};

export default function CreatePage() {
  return <CreateBasket />;
}
