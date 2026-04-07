# Homepage Refonte — Plan d'implémentation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner la homepage Vanzon Explorer avec la vision plateforme nationale — hero national, filtre région sur les vans, CTA propriétaires, badge vans Vanzon.

**Architecture:** Modifications ciblées sur 4 fichiers. `MarketplaceVansSection` reste Server Component (fetch Sanity + Supabase) et passe les données à un nouveau `MarketplaceVansGrid` Client Component qui gère le filtre région. Deux nouveaux composants créés : `MarketplaceVansGrid` et `ProprietaireCTA`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Sanity

**Spec de référence:** `docs/superpowers/specs/2026-04-07-homepage-refonte-design.md`

---

## Fichiers touchés

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| Modifier | `src/app/(site)/page.tsx` | Hero subtitle + bouton secondaire + ajout ProprietaireCTA |
| Créer | `src/components/homepage/ProprietaireCTA.tsx` | Section CTA pour propriétaires de vans |
| Créer | `src/components/marketplace/MarketplaceVansGrid.tsx` | Client Component : pills filtre région + grille avec badge |
| Modifier | `src/components/marketplace/MarketplaceVansSection.tsx` | Passer les données au Grid, déléguer le rendu |

---

## Chunk 1 : Hero + ProprietaireCTA

### Task 1 : Modifier le hero dans page.tsx

**Fichiers :**
- Modifier : `src/app/(site)/page.tsx`

- [ ] **Step 1 : Changer le sous-titre du hero**

Dans `src/app/(site)/page.tsx`, trouver le paragraphe du sous-titre (ligne ~122) :

```tsx
// Avant
<p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-10 max-w-xl">
  Location, achat de vans aménagés au Pays Basque, et formation Van Business Academy partout en France.
</p>

// Après
<p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-10 max-w-xl">
  Louez un van aménagé partout en France. Dès 65€/nuit, assurance incluse.
</p>
```

- [ ] **Step 2 : Remplacer le bouton secondaire du hero**

Trouver le bloc des deux boutons (ligne ~126). Remplacer le `LiquidButton` "Acheter un van" :

```tsx
// Avant
<div className="flex w-full sm:w-auto">
  <LiquidButton href="/achat" variant="slate" size="responsive" shineDelay={1.9} fullWidth>
    Acheter un van →
  </LiquidButton>
</div>

// Après
<div className="flex w-full sm:w-auto">
  <LiquidButton href="/proprietaire" variant="slate" size="responsive" shineDelay={1.9} fullWidth>
    Proposer mon van →
  </LiquidButton>
</div>
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Expected : compilation sans erreur TypeScript ni ESLint.

- [ ] **Step 4 : Commit**

```bash
git add src/app/(site)/page.tsx
git commit -m "feat(homepage): hero — sous-titre national + bouton Proposer mon van"
```

---

### Task 2 : Créer le composant ProprietaireCTA

**Fichiers :**
- Créer : `src/components/homepage/ProprietaireCTA.tsx`
- Modifier : `src/app/(site)/page.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/homepage/ProprietaireCTA.tsx
import Link from "next/link";

export default function ProprietaireCTA() {
  return (
    <section className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="max-w-4xl mx-auto px-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Propriétaire de van ? Référencez-le gratuitement.
          </h2>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl">
            Votre van, une page dédiée, visible par des milliers de voyageurs.
            0% de commission pendant la phase de lancement.
          </p>
        </div>
        <div className="mt-6 sm:mt-0 flex-shrink-0">
          <Link
            href="/proprietaire"
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap"
          >
            Référencer mon van →
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Ajouter le composant dans page.tsx après MarketplaceVansSection**

Dans `src/app/(site)/page.tsx`, ajouter l'import en tête de fichier :

```tsx
import ProprietaireCTA from "@/components/homepage/ProprietaireCTA";
```

Puis ajouter le composant juste après `<MarketplaceVansSection />` :

```tsx
<MarketplaceVansSection />
<ProprietaireCTA />
```

- [ ] **Step 3 : Vérifier le build**

```bash
npm run build
```

Expected : compilation sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/components/homepage/ProprietaireCTA.tsx src/app/(site)/page.tsx
git commit -m "feat(homepage): nouvelle section CTA propriétaires de vans"
```

---

## Chunk 2 : MarketplaceVansGrid — filtre région + badge

### Task 3 : Créer MarketplaceVansGrid (Client Component)

**Fichiers :**
- Créer : `src/components/marketplace/MarketplaceVansGrid.tsx`

Ce composant reçoit les deux listes de vans en props, dérive les régions disponibles, gère l'état du filtre actif, et affiche les pills + la grille avec badge sur les vans officiels.

**Logique de filtrage :**
- `"Tous"` → affiche `officialVans` + `marketplaceVans`
- `"Pays Basque"` → affiche uniquement `officialVans` (toujours Pays Basque)
- `[ville]` → affiche uniquement `marketplaceVans` dont `location_city === ville`

**Badge :** Les `officialVans` sont enveloppés dans un `<div className="relative">` avec un badge absolu `★ Van Vanzon` positionné en haut à gauche de la card.

- [ ] **Step 1 : Créer le composant**

```tsx
// src/components/marketplace/MarketplaceVansGrid.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import VanCard from "@/components/van/VanCard";
import MarketplaceVanCard from "./MarketplaceVanCard";
import { slugify } from "@/lib/slugify";
import type { VanCard as VanCardType } from "@/lib/sanity/types";

interface MarketplaceVan {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  seats: number | null;
  photos: string[];
}

interface MarketplaceVansGridProps {
  officialVans: VanCardType[];
  marketplaceVans: MarketplaceVan[];
}

export default function MarketplaceVansGrid({
  officialVans,
  marketplaceVans,
}: MarketplaceVansGridProps) {
  const [activeRegion, setActiveRegion] = useState("Tous");

  // Régions dérivées dynamiquement
  const cities = Array.from(new Set(marketplaceVans.map((v) => v.location_city))).sort();
  const regions = ["Tous", ...(officialVans.length > 0 ? ["Pays Basque"] : []), ...cities];

  // Vans filtrés selon la région active
  const filteredOfficial =
    activeRegion === "Tous" || activeRegion === "Pays Basque" ? officialVans : [];
  const filteredMarketplace =
    activeRegion === "Tous"
      ? marketplaceVans
      : activeRegion === "Pays Basque"
      ? []
      : marketplaceVans.filter((v) => v.location_city === activeRegion);

  const totalCount = officialVans.length + marketplaceVans.length;

  return (
    <>
      {/* Header section avec titre + filtre */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Vans disponibles en France
            </h2>
            <p className="text-slate-500 mt-2">
              {totalCount} van{totalCount > 1 ? "s" : ""} sélectionné{totalCount > 1 ? "s" : ""} par Vanzon Explorer
            </p>
          </div>
          <Link
            href="/location"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: "#4D5FEC" }}
          >
            Voir tous
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Pills filtre région — scroll horizontal sur mobile */}
        {regions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  activeRegion === region
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grille de vans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOfficial.map((van) => (
          <div key={van._id} className="relative">
            <VanCard van={van} mode="location" />
            <span className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
              ★ Van Vanzon
            </span>
          </div>
        ))}
        {filteredMarketplace.map((van) => (
          <MarketplaceVanCard
            key={van.id}
            {...van}
            href={`/location/${slugify(van.location_city)}/${van.id}`}
          />
        ))}
      </div>

      {/* Voir tous — mobile */}
      <div className="sm:hidden mt-6 text-center">
        <Link href="/location" className="btn-ghost px-6 py-3 rounded-xl font-semibold text-sm inline-flex">
          Voir tous les vans →
        </Link>
      </div>
    </>
  );
}
```

- [ ] **Step 2 : Vérifier que le fichier compile**

```bash
npx tsc --noEmit
```

Expected : aucune erreur TypeScript.

---

### Task 4 : Refactoriser MarketplaceVansSection pour utiliser le Grid

**Fichiers :**
- Modifier : `src/components/marketplace/MarketplaceVansSection.tsx`

- [ ] **Step 1 : Remplacer le contenu de MarketplaceVansSection**

`MarketplaceVansSection` devient un thin wrapper : fetch des données + délégation au Grid.

```tsx
// src/components/marketplace/MarketplaceVansSection.tsx
import { createSupabaseAnon } from "@/lib/supabase/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import MarketplaceVansGrid from "./MarketplaceVansGrid";

interface MarketplaceVan {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  seats: number | null;
  photos: string[];
}

export default async function MarketplaceVansSection() {
  const [supabaseResult, sanityVans] = await Promise.all([
    createSupabaseAnon()
      .from("marketplace_vans")
      .select("id, title, van_brand, van_model, location_city, price_per_day, sleeps, seats, photos")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),
    sanityFetch<VanCardType[]>(getAllLocationVansQuery).catch(() => []),
  ]);

  const marketplaceVans = (supabaseResult.data ?? []) as MarketplaceVan[];
  const officialVans = (sanityVans ?? []) as VanCardType[];

  if (officialVans.length + marketplaceVans.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <MarketplaceVansGrid
          officialVans={officialVans}
          marketplaceVans={marketplaceVans}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2 : Build complet**

```bash
npm run build
```

Expected : build Next.js sans erreur. Vérifier en particulier qu'il n'y a pas d'erreur "cannot serialize" sur les props passées du Server Component vers le Client Component.

- [ ] **Step 3 : Lint**

```bash
npm run lint
```

Expected : aucune erreur ESLint.

- [ ] **Step 4 : Commit final**

```bash
git add src/components/marketplace/MarketplaceVansSection.tsx src/components/marketplace/MarketplaceVansGrid.tsx
git commit -m "feat(homepage): filtre région + badge Van Vanzon sur la grille de vans"
```

---

## Vérification manuelle finale

Après toutes les tâches, vérifier visuellement dans le navigateur (`npm run dev`) :

- [ ] Hero : sous-titre affiché "Louez un van aménagé partout en France. Dès 65€/nuit, assurance incluse."
- [ ] Hero : bouton secondaire "Proposer mon van →" pointe vers `/proprietaire`
- [ ] Section vans : pills "Tous | Pays Basque | [villes]" visibles et cliquables
- [ ] Section vans : filtrage fonctionne (cliquer "Pays Basque" → seuls Yoni et Xalbat visibles)
- [ ] Section vans : badge "★ Van Vanzon" visible sur Yoni et Xalbat
- [ ] Section vans : pills en scroll horizontal sur mobile (resize navigateur < 640px)
- [ ] ProprietaireCTA : section visible entre les vans et la section Pays Basque
- [ ] ProprietaireCTA : lien "Référencer mon van →" pointe vers `/proprietaire`
- [ ] Build propre : `npm run build` sans erreur
