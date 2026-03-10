import Link from "next/link";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import PriceDisplay from "./PriceDisplay";
import VanImageCarousel from "./VanImageCarousel";

// Équipements à afficher sur la card
const equipmentBadges: { key: keyof VanCardType; label: string; icon: string }[] = [
  { key: "eq_kitchen", label: "Cuisine coulissante", icon: "🍳" },
  { key: "eq_toilet", label: "Toilettes sèches", icon: "🚽" },
  { key: "eq_solar", label: "Électricité", icon: "⚡" },
  { key: "eq_shower", label: "Douche solaire", icon: "🚿" },
  { key: "eq_outdoor_chairs", label: "Chaise de camping", icon: "🪑" },
];


interface VanCardProps {
  van: VanCardType;
  /** Mode d'affichage : location ou achat */
  mode: "location" | "achat";
}

export default function VanCard({ van, mode }: VanCardProps) {
  const href = mode === "location" ? `/location/${van.slug}` : `/achat/${van.slug}`;

  // Toutes les images : mainImage + gallery
  const slides = [
    ...(van.mainImage?.url ? [{ url: van.mainImage.url, alt: van.mainImage.alt || van.name }] : []),
    ...(van.gallery?.filter((g) => g?.url).map((g) => ({ url: g.url, alt: g.alt || van.name })) ?? []),
  ];

  const visibleEquipments = equipmentBadges.filter(
    (eq) => van[eq.key as keyof VanCardType]
  );

  return (
    <article className="glass-card glass-card-hover overflow-hidden group">
      {/* ── Carousel images ── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <VanImageCarousel slides={slides} name={van.name} />

        {/* Badge statut — top left */}
        <span className="absolute top-3 left-3 z-30 badge-glass !bg-white/90 !text-slate-700 shadow-sm">
          Disponible
        </span>
      </div>

      {/* ── Corps ── */}
      <div className="p-3 md:p-5">
        {/* Nom */}
        <h3 className="font-semibold text-slate-900 text-sm md:text-lg leading-tight">
          {van.name}
        </h3>

        {/* Badges équipements */}
        {visibleEquipments.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 md:gap-1.5 md:mt-3">
            {visibleEquipments.map((eq) => (
              <span key={eq.key} className="badge-glass !text-[10px] !px-1.5 !py-0.5 md:!text-xs md:!px-2.5 md:!py-1">
                <span className="hidden sm:inline">{eq.icon} </span>{eq.label}
              </span>
            ))}
          </div>
        )}

        {/* Prix */}
        <div className="mt-3 md:mt-4">
          {mode === "location" && van.startingPricePerNight ? (
            <PriceDisplay
              startingPrice={van.startingPricePerNight}
              platform={van.externalBookingPlatform}
              size="sm"
            />
          ) : mode === "achat" && van.salePrice ? (
            <span className="text-blue-600 font-bold text-base md:text-xl">
              {van.salePrice.toLocaleString("fr-FR")} €
            </span>
          ) : null}
        </div>

        {/* CTA */}
        <Link
          href={href}
          className="btn-ghost w-full text-center text-xs md:text-sm mt-3 md:mt-4 block !py-2 md:!py-2.5"
        >
          Voir ce van
        </Link>
      </div>
    </article>
  );
}
