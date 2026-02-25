import Image from "next/image";
import Link from "next/link";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import PriceDisplay from "./PriceDisplay";

// Équipements à afficher en priorité sur la card
const equipmentBadges: { key: keyof VanCardType; label: string; icon: string }[] = [
  { key: "eq_shower", label: "Douche", icon: "🚿" },
  { key: "eq_kitchen", label: "Cuisine", icon: "🍳" },
  { key: "eq_wifi", label: "Wi-Fi", icon: "📶" },
  { key: "eq_surf_rack", label: "Surf rack", icon: "🏄" },
  { key: "eq_outdoor_awning", label: "Auvent", icon: "⛺" },
  { key: "eq_bike_rack", label: "Porte-vélos", icon: "🚲" },
  { key: "eq_toilet", label: "WC", icon: "🚽" },
];

const vanTypeLabels: Record<string, string> = {
  fourgon: "Fourgon",
  "camping-car": "Camping-car",
  combi: "Combi",
  utilitaire: "Utilitaire",
};

interface VanCardProps {
  van: VanCardType;
  /** Mode d'affichage : location ou achat */
  mode: "location" | "achat";
}

export default function VanCard({ van, mode }: VanCardProps) {
  const href = mode === "location" ? `/location/${van.slug}` : `/achat/${van.slug}`;

  // Badges équipements présents (max 4)
  const activeEquipments = equipmentBadges.filter(
    (eq) => van[eq.key as keyof VanCardType]
  );
  const visibleEquipments = activeEquipments.slice(0, 4);
  const extraCount = activeEquipments.length - 4;

  return (
    <article className="glass-card glass-card-hover overflow-hidden group">
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {van.mainImage?.url ? (
          <Image
            src={van.mainImage.url}
            alt={van.mainImage.alt || van.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
            <span className="text-4xl">🚐</span>
          </div>
        )}

        {/* Badge statut — top left */}
        <span className="absolute top-3 left-3 badge-glass !bg-white/90 !text-slate-700 shadow-sm">
          Disponible
        </span>

        {/* Badge coup de coeur — top right */}
        {van.featured && (
          <span className="absolute top-3 right-3 badge-glass !bg-blue-500 !text-white !border-blue-500/20 shadow-sm">
            Coup de coeur
          </span>
        )}
      </div>

      {/* ── Corps ── */}
      <div className="p-5">
        {/* Nom + tagline */}
        <h3 className="font-semibold text-slate-900 text-lg leading-tight">
          {van.name}
        </h3>
        {van.tagline && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{van.tagline}</p>
        )}

        {/* Infos rapides */}
        <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
          {van.capacity && (
            <span className="flex items-center gap-1">
              🛏 {van.capacity} pers.
            </span>
          )}
          {van.vanType && (
            <span>{vanTypeLabels[van.vanType] || van.vanType}</span>
          )}
        </div>

        {/* Badges équipements */}
        {visibleEquipments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {visibleEquipments.map((eq) => (
              <span key={eq.key} className="badge-glass">
                {eq.icon} {eq.label}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="badge-glass">+{extraCount}</span>
            )}
          </div>
        )}

        {/* Prix */}
        <div className="mt-4">
          {mode === "location" && van.startingPricePerNight ? (
            <PriceDisplay
              startingPrice={van.startingPricePerNight}
              platform={van.externalBookingPlatform}
              size="sm"
            />
          ) : mode === "achat" && van.salePrice ? (
            <span className="text-blue-600 font-bold text-xl">
              {van.salePrice.toLocaleString("fr-FR")} €
            </span>
          ) : null}
        </div>

        {/* CTA */}
        <Link
          href={href}
          className="btn-ghost w-full text-center text-sm mt-4 block"
        >
          Voir ce van
        </Link>
      </div>
    </article>
  );
}
