import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Paiement | Van Business Academy",
  robots: { index: false, follow: false },
};

export default function PaiementPage() {
  return <CheckoutClient />;
}
