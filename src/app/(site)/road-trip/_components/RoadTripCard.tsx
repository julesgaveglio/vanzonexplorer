import Image from "next/image";
import Link from "next/link";

interface RoadTripCardProps {
  title: string;
  regionName: string;
  regionSlug: string;
  slug: string;
  duree?: number;
  style?: string;
  profil?: string;
  excerpt?: string;
  coverImage?: { url: string; alt: string };
  qualityScore?: number;
}

export default function RoadTripCard({ title, regionName, regionSlug, slug, duree, style, excerpt, coverImage }: RoadTripCardProps) {
  return (
    <Link href={`/road-trip/${regionSlug}/${slug}`} className="group glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative h-48 bg-slate-100">
        {coverImage?.url ? (
          <Image src={coverImage.url} alt={coverImage.alt || title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🗺️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {duree && (
          <span className="absolute bottom-3 left-3 bg-white/90 text-slate-800 text-xs font-semibold px-2 py-1 rounded-full">
            {duree} jours
          </span>
        )}
        {style && (
          <span className="absolute bottom-3 right-3 bg-accent-blue/90 text-white text-xs font-semibold px-2 py-1 rounded-full capitalize">
            {style}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-accent-blue uppercase tracking-wider mb-1">{regionName}</p>
        <h3 className="text-slate-900 font-bold text-sm leading-snug mb-2 group-hover:text-accent-blue transition-colors line-clamp-2">{title}</h3>
        {excerpt && <p className="text-slate-500 text-xs line-clamp-2">{excerpt}</p>}
      </div>
    </Link>
  );
}
