interface RestaurantCardProps {
  nom?: string;
  type?: string;
  specialite?: string;
}

export default function RestaurantCard({ nom, type, specialite }: RestaurantCardProps) {
  if (!nom) return null;
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🍽️</span>
        <h4 className="font-semibold text-orange-800 text-sm">Où manger</h4>
      </div>
      <p className="text-orange-900 font-medium text-sm">{nom}</p>
      {type && <p className="text-orange-700 text-xs">{type}</p>}
      {specialite && <p className="text-orange-600 text-xs italic mt-1">Spécialité : {specialite}</p>}
    </div>
  );
}
