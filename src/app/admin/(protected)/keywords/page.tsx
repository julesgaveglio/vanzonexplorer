import { Metadata } from "next";
import KeywordsClient from "./KeywordsClient";

export const metadata: Metadata = {
  title: "Mots-Clés — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function KeywordsPage() {
  return <KeywordsClient />;
}
