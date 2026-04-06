import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

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
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2">
          <a href="/" className="hover:text-blue-500 transition-colors">Accueil</a>
          <span>/</span>
          <a href="/location" className="hover:text-blue-500 transition-colors">Location</a>
          <span>/</span>
          <span className="text-slate-600">{van.location_city}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

          {/* Galerie */}
          <div className="space-y-3">
            {photos[0] && (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[0]} alt={van.title} className="w-full h-full object-cover" />
              </div>
            )}
            {photos.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(1, 4).map((url: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infos + CTA */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{van.title}</h1>
            <p className="text-slate-500 mb-1">
              {van.van_brand} {van.van_model}{van.van_year ? ` · ${van.van_year}` : ""}
            </p>
            <p className="flex items-center gap-1.5 text-slate-500 mb-6">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {van.location_city}{van.location_postal_code ? ` (${van.location_postal_code})` : ""}
            </p>

            <div className="glass-card p-5 rounded-2xl mb-6">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black text-slate-900">{van.price_per_day}€</span>
                <span className="text-slate-400 mb-1">/jour</span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Durée minimum : {van.min_days} nuit{van.min_days > 1 ? "s" : ""}
                {van.deposit ? ` · Caution : ${van.deposit}€` : ""}
              </p>
              {van.booking_url ? (
                <a
                  href={van.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
                >
                  Voir les disponibilités
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="text-sm text-slate-400 text-center">Contactez le propriétaire pour réserver</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="glass-card p-3 rounded-xl text-center">
                <div className="font-bold text-slate-900 text-lg">{van.sleeps}</div>
                <div className="text-slate-400 text-xs">Couchages</div>
              </div>
              {van.seats && (
                <div className="glass-card p-3 rounded-xl text-center">
                  <div className="font-bold text-slate-900 text-lg">{van.seats}</div>
                  <div className="text-slate-400 text-xs">Places</div>
                </div>
              )}
              <div className="glass-card p-3 rounded-xl text-center">
                <div className="font-bold text-slate-900 text-lg capitalize">{(van.transmission ?? "man").slice(0, 3)}</div>
                <div className="text-slate-400 text-xs">Boîte</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {van.description && (
          <section className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-slate-900 text-lg mb-3">Description</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{van.description}</p>
          </section>
        )}

        {/* Équipements */}
        {equipments.length > 0 && (
          <section className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-slate-900 text-lg mb-4">Équipements</h2>
            <div className="flex flex-wrap gap-2">
              {equipments.map((eq: string) => (
                <span key={eq} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium">
                  {EQUIPMENT_LABELS[eq] ?? eq}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA bas de page */}
        {van.booking_url && (
          <div className="text-center py-8">
            <a
              href={van.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg"
            >
              Réserver ce van
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
