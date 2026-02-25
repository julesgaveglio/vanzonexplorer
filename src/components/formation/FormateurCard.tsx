interface FormateurCardProps {
  name: string;
  role: string;
  badge: string;
  badgeColor: "blue" | "amber";
  description: string;
  tags: string[];
  imageUrl?: string;
}

import Image from "next/image";

const badgeStyles = {
  blue: "!bg-blue-50 !border-blue-200/50 !text-blue-700",
  amber: "!bg-amber-50 !border-amber-200/50 !text-amber-700",
};

export default function FormateurCard({
  name,
  role,
  badge,
  badgeColor,
  description,
  tags,
  imageUrl,
}: FormateurCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-100">
      {/* Photo avec overlay */}
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={`Photo de ${name}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="text-center">
              <span className="text-3xl block text-slate-300">👤</span>
            </div>
          </div>
        )}
        
        {/* Badge sur la photo */}
        <div className="absolute top-3 right-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{name}</h3>
          <p className="text-sm text-slate-500 font-medium">{role}</p>
        </div>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="inline-block px-2 py-1 text-xs font-medium bg-slate-50 text-slate-600 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
