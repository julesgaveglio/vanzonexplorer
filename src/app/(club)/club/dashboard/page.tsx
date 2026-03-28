import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";

export const metadata: Metadata = {
  title: "Mon espace — Club Privé Vanzon",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
