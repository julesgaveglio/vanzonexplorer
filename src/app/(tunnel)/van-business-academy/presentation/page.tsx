import type { Metadata } from "next";
import VSLClient from "./VSLClient";

export const metadata: Metadata = {
  title: "Vidéo Formation | Van Business Academy",
  robots: { index: false, follow: false },
};

export default function VSLPage() {
  return <VSLClient />;
}
