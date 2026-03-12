# Location Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Améliorer les pages `/location` et sous-pages de destination avec un hero calqué sur la homepage, des photos Pexels par destination, le départ depuis Cambo-les-Bains, et une intégration Google Maps iframe.

**Architecture:** Utilitaire serveur `src/lib/pexels.ts` pour fetch les photos via l'API Pexels (revalidate 24h). Les sous-pages deviennent des server components async. La page `/location` principale hérite du hero homepage (full-screen, stats, badge cliquable, flèche animée). Google Maps via iframe embed sans clé API.

**Note implémentation:** Pour les Tasks 7-10, TOUJOURS lire le fichier complet avant d'éditer pour identifier les chaînes exactes à remplacer. Les structures de chaque page varient — ne pas supposer que le contenu est identique à Biarritz.

**Tech Stack:** Next.js 14 App Router, Server Components, Pexels REST API, Google Maps iframe embed, Tailwind CSS, Framer Motion (existant), next/image

---

## Chunk 1: Setup — Mémoire, env, utilitaire Pexels

### Task 1: Sauvegarder la mémoire Cambo-les-Bains

**Files:**
- Create: `.claude/projects/-Users-julesgaveglio-vanzon-website-claude-code/memory/project_cambo-les-bains.md`
- Modify: `.claude/projects/-Users-julesgaveglio-vanzon-website-claude-code/memory/MEMORY.md`

- [ ] **Step 1: Créer le répertoire memory si absent**

```bash
mkdir -p /Users/julesgaveglio/.claude/projects/-Users-julesgaveglio-vanzon-website-claude-code/memory
```

Expected: no error (idempotent)

- [ ] **Step 2: Créer le fichier mémoire**

```markdown
---
name: Vanzon Explorer — Point de départ Cambo-les-Bains
description: Le départ des vans Vanzon Explorer est depuis Cambo-les-Bains (64250), pas Bayonne
type: project
---

Le point de départ (remise des clés) des vans Vanzon Explorer est **Cambo-les-Bains (64250)**, Pays Basque.

Distances depuis Cambo-les-Bains :
- Biarritz : ~25 min (22 km)
- Saint-Jean-de-Luz : ~20 min (18 km)
- Bayonne : ~15 min (13 km)
- Hossegor : ~45 min (40 km)
- Forêt d'Irati : ~45 min (55 km)

Toutes les mentions "Départ Bayonne" dans les pages location doivent être remplacées par "Départ Cambo-les-Bains".
```

- [ ] **Step 3: Ajouter le pointeur dans MEMORY.md**

Ajouter la ligne dans `MEMORY.md` :
```
- [project_cambo-les-bains.md](project_cambo-les-bains.md) — Point de départ vans : Cambo-les-Bains (64250), distances par destination
```

---

### Task 2: Configurer la clé Pexels et créer l'utilitaire

**Files:**
- Modify: `.env.local` — ajouter `PEXELS_API_KEY`
- Create: `src/lib/pexels.ts`

- [ ] **Step 1: Ajouter la clé dans `.env.local`**

Ajouter à la fin de `.env.local` :
```
PEXELS_API_KEY=your_pexels_api_key_here
```

Note: clé gratuite sur https://www.pexels.com/api/ — créer un compte, copier la clé API.
**IMPORTANT: `.env.local` est dans `.gitignore` — ne jamais committer ce fichier.**

- [ ] **Step 2: Créer `src/lib/pexels.ts`**

```typescript
export interface PexelsPhoto {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

// Fallback photos par destination si API non configurée
const FALLBACKS: Record<string, string> = {
  default: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
};

export async function fetchPexelsPhoto(
  query: string,
  fallbackUrl?: string
): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return fallbackUrl
      ? { url: fallbackUrl, alt: query, photographer: "", photographerUrl: "" }
      : null;
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 86400 }, // Cache 24h
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return {
      url: photo.src.large2x,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/pexels.ts
git commit -m "feat: add Pexels API utility for destination photos"
```

---

### Task 3: Créer le skill Claude find-pexels-photo

**Files:**
- Create: `agents/find-pexels-photo.md`

- [ ] **Step 1: Créer le fichier**

```markdown
# Skill: find-pexels-photo

Utilise ce skill chaque fois que tu crées ou modifies une section avec une image dans une page de destination (location, articles, etc.) pour trouver automatiquement une photo pertinente via Pexels.

## Process

1. **Identifier le contexte** : quelle destination / ambiance / sujet est représenté ?
2. **Construire la query Pexels** : 3-5 mots en anglais, descriptifs et visuels (ex: `biarritz surf atlantic beach france`, `hossegor surf waves landes`)
3. **Appeler l'API Pexels** :

```bash
curl -H "Authorization: $PEXELS_API_KEY" \
  "https://api.pexels.com/v1/search?query=QUERY&per_page=5&orientation=landscape"
```

4. **Choisir la meilleure photo** : préférer les photos avec lumière naturelle, sans texte visible, composition claire, couleurs vives
5. **Insérer dans le code** :
   - URL : `photo.src.large2x` (max 1260px, poids raisonnable)
   - `alt` : description SEO en français (ex: "Surf à Biarritz depuis un van aménagé")
   - Attribution si visible : `Photo: [photographer] / Pexels` en petit texte sous l'image

## Queries recommandées par destination

| Destination | Query suggérée |
|-------------|----------------|
| Biarritz | `biarritz surf atlantic beach basque` |
| Hossegor | `hossegor surf waves landes beach` |
| Bayonne | `bayonne basque city cathedral france` |
| Saint-Jean-de-Luz | `saint jean de luz harbor basque village` |
| Week-end Pays Basque | `basque country road trip landscape` |
| Forêt d'Irati | `irati forest beech trees pyrenees` |
| Cambo-les-Bains | `cambo les bains basque village spa` |

## Format SEO

- Taille cible : `large2x` = max 1260×840px
- Toujours renseigner `alt` avec le contexte SEO (destination + activité + "van")
- Ne jamais laisser `alt=""` sur une image de destination
```

- [ ] **Step 2: Commit**

```bash
git add agents/find-pexels-photo.md
git commit -m "feat: add find-pexels-photo Claude skill"
```

---

## Chunk 2: Page `/location` principale — Hero + Maps

### Task 4: Refaire le hero de `/location` pour matcher la homepage

**Files:**
- Modify: `src/app/(site)/location/page.tsx`

Référence : `src/app/(site)/page.tsx` lignes 30-105 (hero section)

- [ ] **Step 1: Ajouter import et remplacer la ligne de fetch**

En haut du fichier, ajouter après les imports existants :
```typescript
import { getGooglePlaceStats } from "@/lib/google-places";
```

La page est déjà async (`export default async function LocationPage()`). Remplacer la ligne 134 existante :
```typescript
// AVANT (supprimer cette ligne) :
const vans = await sanityFetch<VanCardType[]>(getAllLocationVansQuery) ?? [];

// APRÈS (remplacer par) :
const [vans, placeStats] = await Promise.all([
  sanityFetch<VanCardType[]>(getAllLocationVansQuery).then(r => r ?? []),
  getGooglePlaceStats(),
]);
```

- [ ] **Step 2: Remplacer la section hero**

Note: `btn-shine` est défini dans `src/app/globals.css` et disponible globalement — aucun import nécessaire.

Remplacer le bloc `<section className="relative min-h-[80vh]...">` par :

```tsx
<section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
  <div className="absolute inset-0">
    <Image
      src="https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
      alt="Van aménagé au Pays Basque face à l'Atlantique"
      fill
      className="object-cover object-center sm:object-center object-right"
      priority
      unoptimized
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
    <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
  </div>

  <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
    <nav aria-label="Fil d'Ariane" className="mb-6">
      <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
        <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
        <li>›</li>
        <li className="text-white/80">Location</li>
      </ol>
    </nav>

    <div className="max-w-2xl">
      <a
        href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105 cursor-pointer"
      >
        <span className="text-amber-400">★★★★★</span>
        <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google · {placeStats.ratingDisplay}/5 · Départ Cambo-les-Bains</span>
      </a>

      <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
        Location van aménagé<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
          au Pays Basque
        </span>
      </h1>

      <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
        Vans tout équipés, assurance incluse, départ Cambo-les-Bains.
        Surf, montagne, road trip — explorez le Pays Basque en toute liberté dès <strong className="text-white">65€/nuit</strong>.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="#nos-vans"
          className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
        >
          Voir nos vans disponibles
        </a>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
        >
          Nous contacter →
        </Link>
      </div>
    </div>

    <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
      {[
        { value: "65€", label: "/ nuit", sub: "à partir de" },
        { value: "2", label: "vans", sub: "exclusifs" },
        { value: `${placeStats.ratingDisplay}★`, label: "Google", sub: `${placeStats.reviewCount} avis` },
      ].map((stat) => (
        <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
          <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
          <div className="text-2xl font-black text-white">{stat.value}</div>
          <div className="text-xs text-white/70 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  </div>

  <a href="#nos-vans" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </a>
</section>
```

- [ ] **Step 3: Mettre à jour la barre de réassurance**

Remplacer le tableau et callback `.map` complet dans la section `bg-slate-950` :
```tsx
{[
  { icon: "📍", text: "Départ Cambo-les-Bains, Pays Basque" },
  { icon: "🛡️", text: "Assurance tous risques incluse" },
  { icon: "💰", text: "Dès 65€/nuit" },
  { icon: "⭐", text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google` },
  { icon: "🔑", text: "Livraison possible à Biarritz" },
].map((item) => (
  <div key={item.text} className="flex items-center gap-2">
    <span>{item.icon}</span>
    <span>{item.text}</span>
  </div>
))}
```

- [ ] **Step 4: Mettre à jour le texte du CTA final**

Dans la section CTA final (py-28), remplacer :
`récupération à Bayonne.` → `récupération à Cambo-les-Bains.`

---

### Task 5: Ajouter la section Google Maps sur `/location`

**Files:**
- Modify: `src/app/(site)/location/page.tsx`

- [ ] **Step 1: Ajouter la section Maps entre "Pourquoi Vanzon" et FAQ**

```tsx
{/* ── Google Maps — Point de départ ── */}
<section className="py-20 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <div className="text-center mb-10">
      <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
        📍 Point de départ
      </span>
      <h2 className="text-3xl font-black text-slate-900 mb-3">
        Où récupérer le van ?
      </h2>
      <p className="text-slate-500 text-lg max-w-xl mx-auto">
        Remise des clés à <strong>Cambo-les-Bains</strong> (64250) — à 15 min de Bayonne,
        25 min de Biarritz. Livraison possible sur demande.
      </p>
    </div>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe
        src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Cambo-les-Bains — Point de départ Vanzon Explorer"
      />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(site)/location/page.tsx
git commit -m "feat: location page — hero full-screen homepage style + Google Maps Cambo-les-Bains"
```

---

## Chunk 3: Sous-pages destination — Pexels + Cambo + Maps

### Task 6: Page Biarritz

**Files:**
- Modify: `src/app/(site)/location/biarritz/page.tsx`

- [ ] **Step 1: Ajouter import et rendre async**

```typescript
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";

export const revalidate = 86400;

export default async function LocationBiarritzPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto(
      "biarritz surf atlantic beach basque france",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
    ),
    getGooglePlaceStats(),
  ]);
```

- [ ] **Step 2: Mettre à jour le hero**

Remplacer `min-h-[70vh]` → `min-h-screen -mt-16`

Ajouter le second gradient `bg-gradient-to-r from-blue-950/30 via-transparent to-transparent`

Remplacer l'image src par `photo?.url ?? "..."` (fallback Sanity)

Remplacer le badge statique par un badge cliquable :
```tsx
<a
  href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105"
>
  <span className="text-amber-400">★★★★★</span>
  <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains</span>
</a>
```

Ajouter stats grid bottom-right et flèche animée :
```tsx
<div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
  {[
    { value: "65€", label: "/ nuit", sub: "à partir de" },
    { value: "2", label: "vans", sub: "exclusifs" },
    { value: `${placeStats.ratingDisplay}★`, label: "Google", sub: `${placeStats.reviewCount} avis` },
  ].map((stat) => (
    <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
      <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
      <div className="text-2xl font-black text-white">{stat.value}</div>
      <div className="text-xs text-white/70 font-medium">{stat.label}</div>
    </div>
  ))}
</div>
<a href="#nos-vans" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
</a>
```

- [ ] **Step 3: Mettre à jour les textes Cambo**

- Badge réassurance : `"Départ Bayonne — 20 min de Biarritz"` → `"Départ Cambo-les-Bains — 25 min"`
- Info pratique récupération : `"Bayonne (20 min de Biarritz)"` → `"Cambo-les-Bains (25 min de Biarritz)"`
- CTA final : `"clés remises à Bayonne."` → `"clés remises à Cambo-les-Bains."`

- [ ] **Step 4: Ajouter la section Google Maps**

Ajouter avant le CTA final :
```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">
      Votre point de départ : Cambo-les-Bains
    </h2>
    <p className="text-slate-500 text-center mb-8">
      À 25 min de Biarritz. Remise des clés sur place, parking gratuit.
    </p>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe
        src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%"
        height="350"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Cambo-les-Bains — Point de départ vers Biarritz"
      />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Ajouter attribution photo Pexels (si photo disponible)**

En bas de la section hero, ajouter :
```tsx
{photo?.photographer && (
  <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">
    Photo: {photo.photographer} / Pexels
  </p>
)}
```

---

### Task 7: Page Hossegor

**Files:**
- Modify: `src/app/(site)/location/hossegor/page.tsx`

- [ ] **Step 1: Ajouter imports, rendre async, fetch Pexels + placeStats**

```typescript
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
export const revalidate = 86400;

export default async function LocationHossegorPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto(
      "hossegor surf waves landes beach france",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
    ),
    getGooglePlaceStats(),
  ]);
```

- [ ] **Step 2: Hero — `min-h-[70vh]` → `min-h-screen -mt-16`, second gradient, badge cliquable, photo dynamique, stats grid, flèche animée**

Même structure que Task 6 Step 2. Badge :
```tsx
<a href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA" target="_blank" rel="noopener noreferrer"
  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105">
  <span className="text-amber-400">★★★★★</span>
  <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains</span>
</a>
```
Image src : `photo?.url ?? "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"`

- [ ] **Step 3: Textes Cambo — barre réassurance + infos pratiques + CTA**

- `"Départ Bayonne — X min de..."` → `"Départ Cambo-les-Bains — 45 min"`
- Infos pratiques récupération → `"Cambo-les-Bains (45 min d'Hossegor)"`
- CTA final → `"clés remises à Cambo-les-Bains."`

- [ ] **Step 4: Ajouter section Google Maps avant le CTA final**

```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Votre point de départ : Cambo-les-Bains</h2>
    <p className="text-slate-500 text-center mb-8">À 45 min d&apos;Hossegor. Remise des clés sur place, parking gratuit.</p>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" title="Cambo-les-Bains — Point de départ vers Hossegor" />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Attribution photo Pexels**

```tsx
{photo?.photographer && (
  <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">Photo: {photo.photographer} / Pexels</p>
)}
```

---

### Task 8: Page Bayonne

**Files:**
- Modify: `src/app/(site)/location/bayonne/page.tsx`

- [ ] **Step 1: Ajouter imports, rendre async, fetch Pexels + placeStats**

```typescript
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
export const revalidate = 86400;

export default async function LocationBayonnePage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto(
      "bayonne basque city ramparts cathedral france",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
    ),
    getGooglePlaceStats(),
  ]);
```

- [ ] **Step 2: Hero — même structure que Task 6/7**

Badge text : `{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains`

- [ ] **Step 3: Textes Cambo**

- Barre réassurance : `"Départ Cambo-les-Bains — 15 min"`
- Infos pratiques : `"Cambo-les-Bains (15 min de Bayonne)"`
- CTA final : `"clés remises à Cambo-les-Bains."`

- [ ] **Step 4: Ajouter section Google Maps avant le CTA final**

```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Votre point de départ : Cambo-les-Bains</h2>
    <p className="text-slate-500 text-center mb-8">À 15 min de Bayonne. Remise des clés sur place, parking gratuit.</p>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" title="Cambo-les-Bains — Point de départ vers Bayonne" />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Attribution photo Pexels**

```tsx
{photo?.photographer && (
  <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">Photo: {photo.photographer} / Pexels</p>
)}
```

---

### Task 9: Page Saint-Jean-de-Luz

**Files:**
- Modify: `src/app/(site)/location/saint-jean-de-luz/page.tsx`

- [ ] **Step 1: Imports, async, fetch**

```typescript
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
export const revalidate = 86400;

export default async function LocationSaintJeanDeLuzPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto(
      "saint jean de luz harbor fishing village basque",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
    ),
    getGooglePlaceStats(),
  ]);
```

- [ ] **Step 2: Hero — mettre à jour la structure**

- `className="relative min-h-[70vh]..."` → `className="relative -mt-16 min-h-screen ..."`
- Ajouter second gradient : `<div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />`
- Image src : `photo?.url ?? "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"`
- Remplacer le badge statique par badge cliquable avec `{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains`
- Ajouter stats grid bottom-right (même code que Task 6 Step 2)
- Ajouter flèche animée (même code que Task 6 Step 2)

- [ ] **Step 3: Textes Cambo**

- Barre réassurance : `"Départ Bayonne..."` → `"Départ Cambo-les-Bains — 20 min"`
- Infos pratiques récupération → `"Cambo-les-Bains (20 min de Saint-Jean-de-Luz)"`
- CTA final → `"clés remises à Cambo-les-Bains."`

- [ ] **Step 4: Ajouter section Google Maps avant le CTA final**

```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Votre point de départ : Cambo-les-Bains</h2>
    <p className="text-slate-500 text-center mb-8">À 20 min de Saint-Jean-de-Luz. Remise des clés sur place, parking gratuit.</p>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" title="Cambo-les-Bains — Point de départ vers Saint-Jean-de-Luz" />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Attribution photo Pexels**

```tsx
{photo?.photographer && (
  <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">Photo: {photo.photographer} / Pexels</p>
)}
```

---

### Task 10: Page Week-end

**Files:**
- Modify: `src/app/(site)/location/week-end/page.tsx`

- [ ] **Step 1: Imports, async, fetch**

```typescript
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
export const revalidate = 86400;

export default async function LocationWeekendPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto(
      "basque country road trip van camping weekend",
      "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
    ),
    getGooglePlaceStats(),
  ]);
```

- [ ] **Step 2: Hero — mettre à jour la structure**

- `className="relative min-h-[70vh]..."` → `className="relative -mt-16 min-h-screen ..."`
- Ajouter second gradient : `<div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />`
- Image src : `photo?.url ?? "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"`
- Remplacer le badge statique par badge cliquable avec `{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains`
- Ajouter stats grid bottom-right (même code que Task 6 Step 2)
- Ajouter flèche animée (même code que Task 6 Step 2)

- [ ] **Step 3: Textes Cambo**

- Barre réassurance : remplacer `"Départ Bayonne, Pays Basque"` → `"Départ Cambo-les-Bains, Pays Basque"`
- Toute mention de récupération ou remise → `"Cambo-les-Bains"`
- CTA final : `"récupération à Bayonne."` → `"récupération à Cambo-les-Bains."`

- [ ] **Step 4: Ajouter section Google Maps avant le CTA final**

```tsx
<section className="py-16 bg-white">
  <div className="max-w-5xl mx-auto px-6">
    <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">Votre point de départ : Cambo-les-Bains</h2>
    <p className="text-slate-500 text-center mb-8">Remise des clés à Cambo-les-Bains (64250). Parking gratuit sur place.</p>
    <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
      <iframe src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
        width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
        referrerPolicy="no-referrer-when-downgrade" title="Cambo-les-Bains — Votre base de départ week-end" />
    </div>
  </div>
</section>
```

- [ ] **Step 5: Attribution photo Pexels**

```tsx
{photo?.photographer && (
  <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">Photo: {photo.photographer} / Pexels</p>
)}
```

- [ ] **Step 6: Commit toutes les sous-pages**

```bash
git add src/app/(site)/location/biarritz/page.tsx \
        src/app/(site)/location/hossegor/page.tsx \
        src/app/(site)/location/bayonne/page.tsx \
        src/app/(site)/location/saint-jean-de-luz/page.tsx \
        src/app/(site)/location/week-end/page.tsx
git commit -m "feat: location sub-pages — Pexels photos, Cambo-les-Bains, Google Maps"
```

---

## Chunk 4: Vérification et déploiement

### Task 11: Vérification visuelle

- [ ] **Step 1:** `npm run build` — vérifier 0 erreur TypeScript
- [ ] **Step 2:** `npm run dev` — ouvrir http://localhost:3000/location
- [ ] **Step 3:** Vérifier que le hero est full-screen avec stats en bas à droite
- [ ] **Step 4:** Vérifier les distances Cambo-les-Bains dans toutes les pages
- [ ] **Step 5:** Vérifier que l'iframe Google Maps s'affiche correctement
- [ ] **Step 6:** Vérifier que les photos Pexels se chargent (ou fallback Sanity si clé non configurée)
- [ ] **Step 7:** Vérifier l'attribution photographe en bas des héros

### Task 12: Push GitHub

- [ ] **Step 1: Vérifier ce qui sera poussé**

```bash
git log origin/main..HEAD --oneline
```

Expected: 4-5 commits listés (pexels utility, skill, location page, sous-pages)

- [ ] **Step 2: Pousser**

```bash
git push origin main
```
