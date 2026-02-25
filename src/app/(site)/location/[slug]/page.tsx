import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/client";
import { getVanBySlugQuery, getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { Van, VanCard as VanCardType } from "@/lib/sanity/types";
import VanGallery from "@/components/van/VanGallery";
import EquipmentGrid from "@/components/van/EquipmentGrid";
import BookingButton from "@/components/van/BookingButton";
import PriceDisplay from "@/components/van/PriceDisplay";
import Badge from "@/components/ui/Badge";

export const revalidate = 60;

// ── Génération statique des slugs ──
export async function generateStaticParams() {
  const vans = await sanityFetch<VanCardType[]>(getAllLocationVansQuery);
  return (vans || []).map((van) => ({ slug: van.slug }));
}

// ── Metadata dynamique ──
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const van = await sanityFetch<Van>(getVanBySlugQuery, { slug: params.slug });
  if (!van) return { title: "Van introuvable" };
  return {
    title: van.seoTitle || `${van.name} — Location`,
    description: van.seoDescription || van.tagline || `Louez ${van.name} au Pays Basque`,
  };
}

const vanTypeLabels: Record<string, string> = {
  fourgon: "Fourgon",
  "camping-car": "Camping-car",
  combi: "Combi",
  utilitaire: "Utilitaire",
};

export default async function LocationVanPage({
  params,
}: {
  params: { slug: string };
}) {
  const van = await sanityFetch<Van>(getVanBySlugQuery, { slug: params.slug });
  if (!van) notFound();

  const allImages = [
    van.mainImage,
    ...(van.gallery || []),
  ].filter(Boolean);

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/location" className="hover:text-slate-600 transition-colors">
            Location
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{van.name}</span>
        </nav>
      </div>

      {/* ── Galerie ── */}
      <div className="max-w-7xl mx-auto px-6">
        <VanGallery images={allImages} vanName={van.name} />
      </div>

      {/* ── Contenu 2 colonnes ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── GAUCHE (2/3) ── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Nom + tagline */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                {van.name}
              </h1>
              {van.tagline && (
                <p className="text-lg text-slate-500 mt-2">{van.tagline}</p>
              )}

              {/* Badges infos */}
              <div className="flex flex-wrap gap-2 mt-4">
                {van.vanType && (
                  <Badge variant="blue">
                    {vanTypeLabels[van.vanType] || van.vanType}
                  </Badge>
                )}
                {van.capacity && (
                  <Badge>🛏 {van.capacity} couchages</Badge>
                )}
                {van.length && (
                  <Badge>📏 {van.length}m</Badge>
                )}
                {van.brand && van.model && (
                  <Badge>
                    {van.brand} {van.model}
                  </Badge>
                )}
                {van.year && <Badge>{van.year}</Badge>}
              </div>
            </div>

            {/* Description (Portable Text) */}
            {van.description && van.description.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Description
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                  {van.description.map((block: unknown, i: number) => {
                    const b = block as { _type?: string; children?: { text?: string }[] };
                    if (b._type === "block") {
                      return (
                        <p key={i}>
                          {b.children?.map((child, j) => (
                            <span key={j}>{child.text}</span>
                          ))}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Équipements */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Équipements
              </h2>
              <EquipmentGrid van={van} />
            </div>

            {/* Highlights */}
            {van.highlights && van.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Points forts
                </h2>
                <ul className="space-y-2">
                  {van.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Règles */}
            {van.rules && van.rules.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Règles d&apos;utilisation
                </h2>
                <ul className="space-y-2">
                  {van.rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-500 text-sm">
                      <span className="text-slate-400">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── DROITE (1/3) — Sticky sidebar ── */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 space-y-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              {/* Prix */}
              {van.startingPricePerNight && (
                <PriceDisplay
                  startingPrice={van.startingPricePerNight}
                  platform={van.externalBookingPlatform}
                  size="lg"
                />
              )}

              {/* Infos rapides */}
              <div className="space-y-2 text-sm text-slate-600 border-t border-border-default pt-4">
                {van.capacity && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Couchages</span>
                    <span className="font-medium">{van.capacity} personnes</span>
                  </div>
                )}
                {van.vanType && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="font-medium">{vanTypeLabels[van.vanType] || van.vanType}</span>
                  </div>
                )}
                {van.insuranceIncluded && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assurance</span>
                    <span className="font-medium text-emerald-600">✓ Incluse</span>
                  </div>
                )}
              </div>

              {/* Bouton réservation */}
              {van.externalBookingUrl && van.externalBookingPlatform && (
                <BookingButton
                  url={van.externalBookingUrl}
                  platform={van.externalBookingPlatform}
                  insuranceIncluded={van.insuranceIncluded}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
