import type { Metadata } from "next";
import { Creator } from "@/components/account/Creator";

export const metadata: Metadata = {
  title: "Creator Dashboard — Weave",
  description:
    "Track indexes you've published, creator-token ownership, and claimable revenue earned through ERC-7641.",
};

export default function CreatorPage() {
  return <Creator />;
}
