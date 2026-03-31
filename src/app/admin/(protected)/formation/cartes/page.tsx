import CardsManagerClient from "./_components/CardsManagerClient";

export type AdminCard = {
  _id: string;
  title: string;
  description?: string;
  image?: { url?: string; alt?: string };
  sortOrder: number;
};

export default function FormationCartesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Van Business Academy</p>
          <h1 className="text-3xl font-black text-slate-900">Cartes Formation</h1>
        </div>
      </div>

      <CardsManagerClient />
    </div>
  );
}
