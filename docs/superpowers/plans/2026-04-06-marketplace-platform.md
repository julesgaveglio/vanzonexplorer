# Marketplace Platform — Homepage Section + Van Pages

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une section "Vans disponibles en France" sur la homepage + créer une page SEO individuelle par van marketplace approuvé.

**Architecture:** Les vans approuvés dans `marketplace_vans` (Supabase) sont affichés sur la homepage via un Server Component. Chaque van a une page publique à `/location/[citySlug]/[vanId]` générée en ISR. La page Pays Basque actuelle est préservée.

**Tech Stack:** Next.js 14 App Router, Supabase (createSupabaseAnon), existing slugify util, existing design system (glass-card, btn-primary).

---

## Chunk 1 — Page individuelle van marketplace

### Task 1 : Route `/location/[city]/[vanId]`

**Files:**
- Create: `src/app/(site)/location/[city]/[vanId]/page.tsx`

- [ ] **Step 1 : Créer le fichier**

```tsx
// src/app/(site)/location/[city]/[vanId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export const revalidate = 3600;

interface Props {
  params: { city: string; vanId: string };
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
    description: `Louez ${van.title} à ${van.location_city} à partir de ${van.price_per_day}€/jour. ${van.description?.slice(0, 120)}`,
    alternates: {
      canonical: `https://vanzonexplorer.com/location/${params.city}/${params.vanId}`,
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

  if (!van || slugify(van.location_city) !== params.city) notFound();

  const photos: string[] = van.photos ?? [];
  const equipments: string[] = van.equipments ?? [];

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <nav className="text-sm text-slate-400 mb-6 flex items-center gap-2">
          <a href="/" className="hover:text-blue-500">Accueil</a>
          <span>/</span>
          <a href="/location" className="hover:text-blue-500">Location</a>
          <span>/</span>
          <span className="text-slate-600">{van.location_city}</span>
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Galerie */}
          <div className="space-y-3">
            {photos[0] && (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                <img src={photos[0]} alt={van.title} className="w-full h-full object-cover" />
              </div>
            )}
            {photos.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(1, 4).map((url: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
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
              {van.van_brand} {van.van_model} {van.van_year ? `· ${van.van_year}` : ""}
            </p>
            <p className="flex items-center gap-1.5 text-slate-500 mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 012-2h8" />
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
                <div className="font-bold text-slate-900 text-lg capitalize">{van.transmission?.slice(0,3)}</div>
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
                  {EQUIPMENT_LABELS[eq] || eq}
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
```

- [ ] **Step 2 : Vérifier que slugify est importable**
```bash
grep -r "export.*slugify" src/lib/slugify.ts
```

- [ ] **Step 3 : Vérifier que createSupabaseAnon existe**
```bash
grep -r "createSupabaseAnon" src/lib/supabase/server.ts | head -5
```

- [ ] **Step 4 : Build local**
```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 5 : Commit**
```bash
git add "src/app/(site)/location/[city]/[vanId]/page.tsx"
git commit -m "feat(marketplace): page individuelle van /location/[city]/[vanId]"
```

---

## Chunk 2 — Section homepage

### Task 2 : Composant MarketplaceVansSection

**Files:**
- Create: `src/components/marketplace/MarketplaceVansSection.tsx`
- Modify: `src/app/(site)/page.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/marketplace/MarketplaceVansSection.tsx
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import Link from "next/link";

interface MarketplaceVan {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  photos: string[];
}

export default async function MarketplaceVansSection() {
  const supabase = createSupabaseAnon();
  const { data: vans } = await supabase
    .from("marketplace_vans")
    .select("id, title, van_brand, van_model, location_city, price_per_day, sleeps, photos")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12);

  const items = (vans ?? []) as MarketplaceVan[];
  if (items.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-accent-blue font-semibold text-sm uppercase tracking-widest mb-2">
            Plateforme nationale
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-text-primary">
            Vans disponibles en France
          </h2>
          <p className="text-text-secondary mt-2">
            {items.length} van{items.length > 1 ? "s" : ""} sélectionné{items.length > 1 ? "s" : ""} par Vanzon Explorer
          </p>
        </div>
        <Link
          href="/location"
          className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-accent-blue hover:underline"
        >
          Voir tous
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((van) => {
          const citySlug = slugify(van.location_city);
          const href = `/location/${citySlug}/${van.id}`;
          return (
            <Link
              key={van.id}
              href={href}
              className="glass-card-hover group rounded-2xl overflow-hidden border border-white/10 hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                {van.photos?.[0] ? (
                  <img
                    src={van.photos[0]}
                    alt={van.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">🚐</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-text-primary text-sm line-clamp-1 mb-1">{van.title}</h3>
                <p className="text-text-secondary text-xs mb-3 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {van.location_city}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-text-primary">{van.price_per_day}€</span>
                    <span className="text-text-secondary text-xs">/jour</span>
                  </div>
                  <span className="text-xs text-text-secondary bg-slate-100 px-2 py-1 rounded-lg">
                    {van.sleeps} couchage{van.sleeps > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="sm:hidden mt-6 text-center">
        <Link href="/location" className="btn-ghost px-6 py-3 rounded-xl font-semibold text-sm">
          Voir tous les vans →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Trouver le bon endroit dans la homepage**
```bash
grep -n "formation\|Footer\|FloatingCTA\|road-trip\|section" "src/app/(site)/page.tsx" | tail -20
```

- [ ] **Step 3 : Ajouter la section dans la homepage**

Dans `src/app/(site)/page.tsx` :
```tsx
import MarketplaceVansSection from "@/components/marketplace/MarketplaceVansSection";

// Dans le JSX, après la section location existante et avant la section formation :
<MarketplaceVansSection />
```

- [ ] **Step 4 : Build**
```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 5 : Commit**
```bash
git add src/components/marketplace/MarketplaceVansSection.tsx "src/app/(site)/page.tsx"
git commit -m "feat(marketplace): section vans disponibles sur la homepage"
```

---

## Chunk 3 — Sitemap

### Task 3 : Ajouter les van pages marketplace au sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1 : Ajouter les imports manquants dans sitemap.ts**

```ts
import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
```

- [ ] **Step 2 : Ajouter la query et les URLs dans sitemap()**

Avant le `return` final :
```ts
const supabase = createSupabaseAnon();
const { data: marketplaceVans } = await supabase
  .from("marketplace_vans")
  .select("id, location_city, updated_at")
  .eq("status", "approved");

const marketplaceVanPages: MetadataRoute.Sitemap = (marketplaceVans ?? []).map((van) => ({
  url: `${BASE_URL}/location/${slugify(van.location_city)}/${van.id}`,
  lastModified: van.updated_at ? new Date(van.updated_at) : new Date(),
  changeFrequency: "weekly" as const,
  priority: 0.8,
}));
```

Et dans le `return` : ajouter `...marketplaceVanPages`.

- [ ] **Step 3 : Build**
```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4 : Commit + push**
```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): pages van marketplace dans le sitemap"
git push
```

---

## Résumé des URLs

| Van | URL publique |
|-----|-------------|
| Ford Transit · Nantes | `/location/nantes/[uuid]` |
| Renault Trafic · Bordeaux | `/location/bordeaux/[uuid]` |
| Tes vans Pays Basque | `/location/yoni` · `/location/xalbat` (inchangés) |

**Aucun conflit** avec les pages statiques existantes (`/location/biarritz` etc.).
