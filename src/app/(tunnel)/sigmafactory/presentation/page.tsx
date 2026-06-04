import type { Metadata } from "next";
import VSLClient from "./VSLClient";

export const metadata: Metadata = {
  title: "Vidéo Présentation | Sigma Factory",
  robots: { index: false, follow: false },
};

export default function SigmaVSLPage() {
  return <VSLClient />;
}
