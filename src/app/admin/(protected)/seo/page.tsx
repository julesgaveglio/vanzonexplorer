import { Metadata } from "next";
import SeoClient from "./SeoClient";

export const metadata: Metadata = {
  title: "SEO Analytics — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function SeoPage() {
  return <SeoClient />;
}
