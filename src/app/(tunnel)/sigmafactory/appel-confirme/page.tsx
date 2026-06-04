import type { Metadata } from "next";
import ConfirmationClient from "./ConfirmationClient";

export const metadata: Metadata = {
  title: "Appel confirme | Sigma Factory",
  robots: { index: false, follow: false },
};

export default function SigmaConfirmationPage() {
  return <ConfirmationClient />;
}
