import type { Metadata } from "next";
import ConfirmationClient from "./ConfirmationClient";

export const metadata: Metadata = {
  title: "Appel confirmé | Van Business Academy",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return <ConfirmationClient />;
}
