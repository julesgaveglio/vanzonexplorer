import type { Metadata } from "next";
import AchatClient from "./AchatClient";

export const metadata: Metadata = {
  title: "Achat van aménagé Pays Basque — Yoni & Xalbat | Vanzon Explorer",
  description:
    "Deux vans aménagés par nos soins à vendre au Pays Basque. Historique complet depuis l'origine, entretenus avec soin. Remise en main propre à Cambo-les-Bains.",
  openGraph: {
    title: "Vans à vendre — Vanzon Explorer",
    description: "Yoni & Xalbat — deux vans entièrement aménagés par nos soins, issus de notre flotte. À vendre au Pays Basque, 25 000 € chacun.",
  },
};

export default function AchatPage() {
  return <AchatClient />;
}
