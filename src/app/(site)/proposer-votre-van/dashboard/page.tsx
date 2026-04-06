import type { Metadata } from "next";
import OwnerDashboardClient from "./_components/OwnerDashboardClient";

export const metadata: Metadata = {
  title: "Mon espace propriétaire",
  description: "Gérez vos annonces de van sur Vanzon Explorer.",
  robots: { index: false, follow: false },
};

export default function OwnerDashboardPage() {
  return <OwnerDashboardClient />;
}
