import Image from "next/image";

interface SpotCardProps {
  nom: string;
  description?: string;
  type?: string;
  mapsUrl?: string;
  wikiExcerpt?: string;
  wikiUrl?: string;
  photo?: { url: string; alt: string; credit?: string };
}

export default function SpotCard({ nom, description, type, mapsUrl, wikiExcerpt, wikiUrl, photo }: SpotCardProps) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
      {photo?.url && (
        <div className="relative h-40">
          <Image src={photo.url} alt={photo.alt || nom} fill className="object-cover" unoptimized />
          {photo.credit && (
            <p className="absolute bottom-1 right-2 text-white/70 text-xs">© {photo.credit}</p>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-slate-900 text-base">{nom}</h3>
          {type && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize shrink-0">{type}</span>}
        </div>
        {description && <p className="text-slate-600 text-sm mb-3 leading-relaxed">{description}</p>}
        {wikiExcerpt && (
          <p className="text-slate-500 text-xs italic border-l-2 border-slate-200 pl-3 mb-3">
            {wikiExcerpt}
            {wikiUrl && <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="text-accent-blue ml-1">→ Wikipedia</a>}
          </p>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-blue hover:underline">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Voir sur Maps
          </a>
        )}
      </div>
    </div>
  );
}
