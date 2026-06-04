import type { Metadata } from "next";
import VSLClient from "./VSLClient";

export const metadata: Metadata = {
  title: "Video Presentation | Sigma Factory",
  robots: { index: false, follow: false },
};

export default function SigmaVSLPage() {
  return <VSLClient />;
}
