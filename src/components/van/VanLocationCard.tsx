import Image from "next/image";

interface Feature {
  icon: string;
  label: string;
}

interface VanLocationCardProps {
  name: string;
  model: string;
  images: string[];
  features: Feature[];
  price: string;
  bookingUrl?: string;
  available: boolean;
}

export default function VanLocationCard({
  name,
  model,
  images,
  features,
  price,
  bookingUrl,
  available,
}: VanLocationCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden pb-6">
      {/* Image principale */}
      <div className="relative mx-4 mt-4">
        <Image
          src={images[0]}
          alt={`Van ${name} — ${model}`}
          width={600}
          height={400}
          className="w-full h-56 object-cover rounded-xl"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {!available && (
          <span className="absolute top-2 left-2 bg-white/90 text-xs font-semibold px-3 py-1 rounded-full text-slate-700 shadow-sm">
            🔧 Bientôt disponible
          </span>
        )}
      </div>

      {/* Nom + modèle */}
      <h3 className="text-xl font-bold text-slate-900 mx-5 mt-3">{name}</h3>
      <p className="text-xs text-slate-400 mx-5 mb-2">{model}</p>

      {/* Séparateur */}
      <hr className="border-slate-100 mx-5 my-3" />

      {/* Équipements */}
      <ul className="mx-5 space-y-0.5">
        {features.map((f) => (
          <li
            key={f.label}
            className="flex items-center gap-2 text-sm text-slate-600 py-1"
          >
            <Image
              src={f.icon}
              alt={f.label}
              width={20}
              height={20}
              className="flex-shrink-0"
            />
            {f.label}
          </li>
        ))}
      </ul>

      {/* Prix */}
      <p className="text-[#4CAF50] font-bold text-center my-3">{price}</p>

      {/* Bouton */}
      {available && bookingUrl ? (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center mx-5 py-2.5 border-[1.5px] border-[#4CAF50] text-[#4CAF50] rounded-lg font-semibold text-sm hover:bg-[#4CAF50] hover:text-white transition-all"
        >
          Plus d&apos;informations
        </a>
      ) : (
        <span className="block text-center mx-5 py-2.5 border-[1.5px] border-slate-200 text-slate-300 rounded-lg font-semibold text-sm cursor-not-allowed">
          Bientôt disponible
        </span>
      )}
    </div>
  );
}
