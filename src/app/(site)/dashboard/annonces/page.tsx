import type { Metadata } from "next";
import OwnerDashboardClient from "../../proprietaire/dashboard/_components/OwnerDashboardClient";

export const metadata: Metadata = {
  title: "Mes annonces — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default function AnnoncesPage() {
  return <OwnerDashboardClient embedded />;
}
