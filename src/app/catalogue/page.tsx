import type { Metadata } from "next";
import { CatalogueScreen } from "@/components/catalogue/CatalogueScreen";

export const metadata: Metadata = {
  title: "Catalogue — Weave",
  description:
    "Every tokenized equity available for basket construction on Robinhood Chain.",
};

export default function CataloguePage() {
  return <CatalogueScreen />;
}
