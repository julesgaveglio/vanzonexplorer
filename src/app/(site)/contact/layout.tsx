import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Vanzon Explorer",
  description:
    "Contactez Vanzon Explorer pour toute question sur la location de van, la formation ou l'achat au Pays Basque. Réponse sous 24h.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
