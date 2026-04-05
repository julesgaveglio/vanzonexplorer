import type { Metadata } from "next";
import AchatLanding from "./AchatLanding";

export const metadata: Metadata = {
  title: "Van aménagé à vendre au Pays Basque — Yoni & Xalbat",
  description:
    "Deux Renault Trafic entièrement aménagés à vendre au Pays Basque. Issus de notre flotte de location, historique complet depuis l'origine. Remise en main propre à Cambo-les-Bains. 25 000 € chacun.",
  alternates: {
    canonical: "https://vanzonexplorer.com/achat",
  },
  openGraph: {
    title: "Vans aménagés à vendre — Pays Basque",
    description: "Yoni & Xalbat — deux Renault Trafic aménagés par nos soins, issus de notre flotte. 25 000 € chacun, remise à Cambo-les-Bains.",
  },
};

export default function AchatPage() {
  return <AchatLanding />;
}
