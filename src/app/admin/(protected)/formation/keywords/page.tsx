import type { Metadata } from "next";
import VbaKeywordsClient from "./_components/VbaKeywordsClient";

export const metadata: Metadata = {
  title: "Mots-Clés VBA | Vanzon Admin",
};

export default function VbaKeywordsPage() {
  return <VbaKeywordsClient />;
}
