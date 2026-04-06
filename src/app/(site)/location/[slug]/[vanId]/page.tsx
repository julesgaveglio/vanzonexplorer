import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import Badge from "@/components/ui/Badge";
import PriceDisplay from "@/components/van/PriceDisplay";
import BookingButton from "@/components/van/BookingButton";
import YescapaReassurance from "@/components/van/YescapaReassurance";
import MarketplaceVanGallery from "@/components/marketplace/MarketplaceVanGallery";

export const revalidate = 3600;

interface Props {
  params: { slug: string; vanId: string };
}

const EQUIPMENT_LABELS: Record<string, string> = {
  "frigo": "Réfrigérateur", "plaque-cuisson": "Plaque de cuisson",
  "evier": "Évier", "vaisselle": "Vaisselle", "douche": "Douche",
  "wc": "WC", "eau-chaude": "Eau chaude", "chauffage": "Chauffage",
  "climatisation": "Climatisation", "moustiquaire": "Moustiquaire",
  "panneau-solaire": "Panneau solaire", "220v": "Prise 220V",
  "batterie-auxiliaire": "Batterie aux.", "store": "Store/Auvent",
  "porte-velo": "Porte-vélo", "galerie": "Galerie de toit",
  "gps": "GPS", "camera-recul": "Caméra de recul",
  "regulateur": "Régulateur de vitesse",
};

const VAN_TYPE_LABELS: Record<string, string> = {
  fourgon: "Fourgon aménagé", van: "Van", combi: "Combi",
  "camping-car": "Camping-car", autre: "Autre",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createSupabaseAnon();
  const { data: van } = await supabase
    .from("marketplace_vans")
    .select("title, location_city, price_per_day, description, photos")
    .eq("id", params.vanId)
    .eq("status", "approved")
    .single();

  if (!van) return { title: "Van introuvable" };

  return {
    title: `${van.title} — Location van ${van.location_city}`,
    description: `Louez ${van.title} à ${van.location_city} à partir de ${van.price_per_day}€/jour. ${(van.description ?? "").slice(0, 120)}`,
    alternates: {
      canonical: `https://vanzonexplorer.com/location/${params.slug}/${params.vanId}`,
    },
    openGraph: {
      title: `${van.title} — Location van ${van.location_city}`,
      description: `À partir de ${van.price_per_day}€/jour · ${van.location_city}`,
      images: van.photos?.[0] ? [{ url: van.photos[0] }] : [],
    },
  };
}

export default async function MarketplaceVanPage({ params }: Props) {
  const supabase = createSupabaseAnon();
  const { data: van } = await supabase
    .from("marketplace_vans")
    .select("*")
    .eq("id", params.vanId)
    .eq("status", "approved")
    .single();

  if (!van || slugify(van.location_city) !== params.slug) notFound();

  const photos: string[] = van.photos ?? [];
  const equipments: string[] = van.equipments ?? [];

  return (
    <>
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/location" className="hover:text-slate-600 transition-colors">Location</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{van.location_city}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">{van.title}</span>
        </nav>
      </div>

      {/* ── Galerie ── */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <MarketplaceVanGallery photos={photos} title={van.title} />
      </div>

      {/* ── Contenu 2 colonnes ── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── GAUCHE (2/3) ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Titre + badges */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                {van.title}
              </h1>
              <p className="text-slate-500 text-lg mb-4">
                {van.van_brand} {van.van_model}{van.van_year ? ` · ${van.van_year}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {van.van_type && (
                  <Badge variant="blue">{VAN_TYPE_LABELS[van.van_type] ?? van.van_type}</Badge>
                )}
                {van.van_brand && van.van_model && (
                  <Badge>{van.van_brand} {van.van_model}</Badge>
                )}
                {van.van_year && <Badge>{van.van_year}</Badge>}
                {van.sleeps && <Badge>🛏 {van.sleeps} couchage{van.sleeps > 1 ? "s" : ""}</Badge>}
                {van.seats && <Badge>👤 {van.seats} places</Badge>}
                {van.transmission && (
                  <Badge>{van.transmission === "automatique" ? "⚙️ Automatique" : "⚙️ Manuelle"}</Badge>
                )}
                <Badge>
                  <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {van.location_city}{van.location_postal_code ? ` (${van.location_postal_code})` : ""}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {van.description && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Description</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                  {van.description.split("\n").map((line: string, i: number) =>
                    line.trim() ? <p key={i}>{line}</p> : null
                  )}
                </div>
              </div>
            )}

            {/* Équipements */}
            {equipments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Équipements</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {equipments.map((eq: string) => (
                    <div key={eq} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      <span className="text-slate-700 text-sm font-medium">
                        {EQUIPMENT_LABELS[eq] ?? eq}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Conditions</h2>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-600 text-sm">
                  <span className="text-slate-400">•</span>
                  Durée minimum : <span className="font-medium">{van.min_days} nuit{van.min_days > 1 ? "s" : ""}</span>
                </li>
                {van.deposit && (
                  <li className="flex items-center gap-2 text-slate-600 text-sm">
                    <span className="text-slate-400">•</span>
                    Caution : <span className="font-medium">{van.deposit}€</span>
                  </li>
                )}
                <li className="flex items-center gap-2 text-slate-600 text-sm">
                  <span className="text-slate-400">•</span>
                  Départ depuis : <span className="font-medium">{van.location_city}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ── DROITE (1/3) — Sticky sidebar ── */}
          <div className="lg:col-span-1" id="reserver">
            <div
              className="glass-card p-6 sticky top-24 space-y-5"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
            >
              {/* Prix */}
              <PriceDisplay
                startingPrice={van.price_per_day}
                platform={van.booking_url ? (() => { try { return new URL(van.booking_url).hostname.replace("www.", ""); } catch { return "la plateforme"; } })() : "la plateforme"}
                size="lg"
              />

              {/* Infos rapides */}
              <div className="space-y-2 text-sm text-slate-600 border-t border-border-default pt-4">
                {van.van_type && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type</span>
                    <span className="font-medium">{VAN_TYPE_LABELS[van.van_type] ?? van.van_type}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Couchages</span>
                  <span className="font-medium">{van.sleeps}</span>
                </div>
                {van.seats && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Places</span>
                    <span className="font-medium">{van.seats}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Durée min.</span>
                  <span className="font-medium">{van.min_days} nuit{van.min_days > 1 ? "s" : ""}</span>
                </div>
                {van.deposit && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Caution</span>
                    <span className="font-medium">{van.deposit}€</span>
                  </div>
                )}
              </div>

              {/* Bouton réservation */}
              {van.booking_url ? (
                <BookingButton
                  url={van.booking_url}
                  platform={van.booking_url.includes("yescapa") ? "Yescapa" : van.booking_url.includes("wikicampers") ? "Wikicampers" : "la plateforme"}
                  insuranceIncluded={van.booking_url.includes("yescapa")}
                />
              ) : (
                <a
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-700 text-base bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Contacter le propriétaire
                </a>
              )}

              {/* Reassurance Yescapa si applicable */}
              {van.booking_url?.includes("yescapa") && <YescapaReassurance />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
