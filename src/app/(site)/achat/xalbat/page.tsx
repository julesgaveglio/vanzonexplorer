import type { Metadata } from "next";
import AchatClient from "../AchatClient";
import { VanProductJsonLd } from "@/components/seo/JsonLd";
import { VANS } from "@/lib/data/vans";

export const metadata: Metadata = {
  title: "Xalbat — Renault Trafic aménagé 2025 à vendre",
  description:
    "Xalbat, Renault Trafic III aménagé par nos soins en 2025. 54 000 km, le van le plus récent de notre flotte. Lit fixe, cuisine coulissante, panneau solaire. 23 500 €. Cambo-les-Bains.",
  keywords: [
    "renault trafic aménagé occasion",
    "van aménagé 2025 vente",
    "fourgon aménagé à vendre pays basque",
    "acheter van aménagé occasion",
  ],
  alternates: {
    canonical: "https://vanzonexplorer.com/achat/xalbat",
  },
  openGraph: {
    title: "Xalbat — Renault Trafic aménagé 2025, 23 500 €",
    description: "Notre dernier aménagement, le van le plus récent de notre flotte. Historique complet, remise à Cambo-les-Bains.",
  },
};

export default function XalbatPage() {
  const van = VANS.find((v) => v.id === "xalbat")!;
  return (
    <>
      <VanProductJsonLd van={van} />
      <AchatClient vanId="xalbat" />
    </>
  );
}
