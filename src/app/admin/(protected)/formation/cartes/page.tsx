import CardsManagerClient from "./_components/CardsManagerClient";
import { AdminPageHeader } from "@/app/admin/_components/ui";

export type AdminCard = {
  _id: string;
  title: string;
  description?: string;
  image?: { url?: string; alt?: string };
  sortOrder: number;
};

export default function FormationCartesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Cartes Formation"
        subtitle="Van Business Academy"
      />
      <CardsManagerClient />
    </div>
  );
}
