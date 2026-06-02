import type { Metadata } from "next";
import { CatalogueTable } from "@/components/catalogue/CatalogueTable";

export const metadata: Metadata = {
  title: "Catalogue — Weave",
  description:
    "Every tokenized equity available for basket construction on Robinhood Chain.",
};

export default function CataloguePage() {
  return (
    <div className="wrap-wide reveal" style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 30 }}>Catalogue</h1>
        <p className="muted" style={{ marginTop: 6, fontSize: 15 }}>
          Every tokenized equity available for basket construction on Robinhood Chain.
        </p>
      </div>
      <CatalogueTable />
    </div>
  );
}
