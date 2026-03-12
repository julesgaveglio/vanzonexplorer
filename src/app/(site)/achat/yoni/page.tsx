import type { Metadata } from "next";
import AchatClient from "../AchatClient";
import { VanProductJsonLd } from "@/components/seo/JsonLd";
import { VANS } from "@/lib/data/vans";

export const metadata: Metadata = {
  title: "Yoni — Renault Trafic aménagé 2024 à vendre | Vanzon Explorer",
  description:
    "Yoni, Renault Trafic III aménagé par nos soins en 2024. 68 000 km, lit fixe, cuisine coulissante, panneau solaire. Historique complet, 25 000 €. Remise à Cambo-les-Bains.",
  keywords: [
    "renault trafic aménagé occasion",
    "van aménagé occasion pays basque",
    "fourgon aménagé à vendre",
    "van aménagé 2024 vente",
  ],
  alternates: {
    canonical: "https://vanzonexplorer.com/achat/yoni",
  },
  openGraph: {
    title: "Yoni — Renault Trafic aménagé 2024, 25 000 €",
    description: "Van aménagé par nos soins, issu de notre flotte de location au Pays Basque. Historique complet, remise à Cambo-les-Bains.",
  },
};

export default function YoniPage() {
  const van = VANS.find((v) => v.id === "yoni")!;
  return (
    <>
      <VanProductJsonLd van={van} />
      <AchatClient vanId="yoni" />
    </>
  );
}
