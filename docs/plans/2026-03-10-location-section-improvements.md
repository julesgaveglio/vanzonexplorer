# Location Section Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer le VanSlider (FOUC + CSS inline) par des cartes Sanity propres sur la homepage, et améliorer la page détail `/location/[slug]` avec bouton Yescapa rose, bouton "Acheter" conditionnel, et encadré de réassurance.

**Architecture:** La homepage remplace `VanSlider` par une grille de `VanCard` alimentée depuis Sanity via `getAllLocationVansQuery` (déjà utilisé). La page `/location/[slug]` est refactored avec un nouveau `BookingButton` Yescapa et un nouveau composant `YescapaReassurance`. `VanSlider.tsx` est supprimé.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, Framer Motion, Sanity CMS, design system glassmorphism Vanzon (globals.css)

---

## Task 1 : Remplacer VanSlider par une grille VanCard sur la homepage

**Files:**
- Modify: `src/app/(site)/page.tsx` — section `#nos-vans`
- Delete: `src/components/van/VanSlider.tsx`

**Context:**
- La section vans est à la ligne ~118 de `page.tsx` : `<section id="nos-vans">` avec `<VanSlider />`
- `VanCard` et `getAllLocationVansQuery` sont déjà importés dans `page.tsx`
- Les vans Sanity ont : `name`, `slug`, `mainImage`, `tagline`, `startingPricePerNight`, `externalBookingPlatform`, équipements

**Step 1 : Supprimer l'import VanSlider de page.tsx**

Dans `src/app/(site)/page.tsx`, retirer :
```tsx
import VanSlider from "@/components/van/VanSlider";
```

**Step 2 : Remplacer la section `#nos-vans`**

Remplacer le bloc `<section id="nos-vans" ...>` par :

```tsx
<section id="nos-vans" className="py-20 bg-white scroll-mt-20">
  <div className="max-w-5xl mx-auto px-6">
    <div className="text-center mb-12">
      <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#3B82F6" }}>
        🚐 Nos vans
      </span>
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
        Deux vans, une liberté totale
      </h2>
      <p className="text-slate-500 text-lg">
        Choisissez votre compagnon de route pour explorer le Pays Basque.
      </p>
    </div>

    {vans && vans.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {vans.map((van) => (
          <VanCard key={van._id} van={van} mode="location" />
        ))}
      </div>
    ) : (
      <p className="text-center text-slate-400">Vans bientôt disponibles.</p>
    )}
  </div>
</section>
```

**Step 3 : Vérifier visuellement**

- Lancer `npm run dev`
- Ouvrir `http://localhost:3000/vanzon`
- Vérifier que la section vans affiche 2 cartes propres sans FOUC
- Vérifier que le bouton "Voir ce van" de chaque carte pointe bien vers `/vanzon/location/yoni` et `/vanzon/location/xalbat`

**Step 4 : Supprimer VanSlider.tsx**

```bash
rm src/components/van/VanSlider.tsx
```

**Step 5 : Vérifier que le build ne casse pas**

```bash
npm run build
```
Expected: compilation sans erreur (plus aucun import de VanSlider)

**Step 6 : Commit**

```bash
git add src/app/(site)/page.tsx
git rm src/components/van/VanSlider.tsx
git commit -m "feat: remplace VanSlider par grille VanCard Sanity sur homepage"
```

---

## Task 2 : Créer le composant YescapaReassurance

**Files:**
- Create: `src/components/van/YescapaReassurance.tsx`

**Step 1 : Créer le composant**

```tsx
// src/components/van/YescapaReassurance.tsx
export default function YescapaReassurance() {
  return (
    <div
      className="glass-card p-5 border-l-4"
      style={{ borderLeftColor: "#E8436C" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(232, 67, 108, 0.10)" }}
        >
          🛡️
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">
            Pourquoi la réservation se fait sur Yescapa ?
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Yescapa est la plateforme de location entre particuliers leader en France.
            En passant par eux, vous bénéficiez automatiquement d&apos;une{" "}
            <strong className="text-slate-700">assurance tous risques</strong> pour
            toute la durée de votre séjour — un vrai filet de sécurité pour vous
            comme pour nous. Le paiement et le contrat sont également sécurisés
            par leur plateforme.
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2 : Vérifier que le composant compile**

```bash
npm run lint
```
Expected: pas d'erreur

**Step 3 : Commit**

```bash
git add src/components/van/YescapaReassurance.tsx
git commit -m "feat: composant YescapaReassurance pour rassurer les utilisateurs"
```

---

## Task 3 : Refactoriser BookingButton avec bouton Yescapa rose

**Files:**
- Modify: `src/components/van/BookingButton.tsx`

**Context:**
- Le composant actuel utilise `btn-primary` (bleu) pour le bouton Yescapa
- Il faut : bouton Yescapa rose (#E8436C → #FF6B8A, dégradé + glow)
- Un bouton "Acheter ce véhicule" conditionnel (prop `achatHref?`)
- L'encadré d'assurance existant reste (simplifié)
- La couleur Yescapa officielle est approximée à `#E8436C` — vérifier visuellement

**Step 1 : Réécrire BookingButton.tsx**

```tsx
// src/components/van/BookingButton.tsx
interface BookingButtonProps {
  url: string;
  platform: string;
  insuranceIncluded?: boolean;
  achatHref?: string; // si défini, affiche le bouton "Acheter ce véhicule"
}

export default function BookingButton({
  url,
  platform,
  insuranceIncluded = true,
  achatHref,
}: BookingButtonProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Bouton Yescapa — rose officiel */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-shine relative inline-flex items-center justify-center gap-2 w-full font-bold text-white py-3.5 px-5 rounded-2xl text-sm active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #E8436C 0%, #FF6B8A 100%)",
          boxShadow: "0 4px 18px rgba(232, 67, 108, 0.50), 0 1px 4px rgba(255, 107, 138, 0.30)",
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        Réserver sur {platform}
        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>

      {/* Bouton "Acheter ce véhicule" — conditionnel */}
      {achatHref && (
        <a
          href={achatHref}
          className="btn-shine inline-flex items-center justify-center gap-2 w-full font-semibold text-white py-3 px-5 rounded-2xl text-sm active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.40)",
          }}
        >
          🔑 Acheter ce véhicule
        </a>
      )}

      {/* Assurance */}
      {insuranceIncluded && (
        <p className="text-center text-xs text-emerald-600 font-medium">
          ✓ Assurance tous risques incluse dans votre réservation
        </p>
      )}
    </div>
  );
}
```

**Step 2 : Vérifier visuellement**

- Ouvrir `http://localhost:3000/vanzon/location/yoni`
- Le bouton Yescapa doit être rose visible
- L'effet glow + shine doit être présent

**Step 3 : Commit**

```bash
git add src/components/van/BookingButton.tsx
git commit -m "feat: BookingButton Yescapa rose avec bouton Acheter conditionnel"
```

---

## Task 4 : Améliorer la page /location/[slug]

**Files:**
- Modify: `src/app/(site)/location/[slug]/page.tsx`

**Context:**
- `van.offerType` est un tableau `("location" | "achat")[]` — si `"achat"` est dedans, afficher le bouton Acheter
- `BookingButton` reçoit maintenant `achatHref?`
- Ajouter `YescapaReassurance` dans la sidebar sous le BookingButton
- L'`achatHref` sera `/achat/${van.slug}` si `van.offerType.includes("achat")`

**Step 1 : Ajouter les imports**

En haut du fichier, ajouter :
```tsx
import YescapaReassurance from "@/components/van/YescapaReassurance";
```

**Step 2 : Calculer achatHref avant le return**

Après `const allImages = [...]`, ajouter :
```tsx
const achatHref = van.offerType?.includes("achat") ? `/achat/${van.slug}` : undefined;
```

**Step 3 : Mettre à jour le BookingButton dans la sidebar**

Remplacer le bloc `{van.externalBookingUrl && van.externalBookingPlatform && (...)}` par :

```tsx
{van.externalBookingUrl && van.externalBookingPlatform && (
  <BookingButton
    url={van.externalBookingUrl}
    platform={van.externalBookingPlatform}
    insuranceIncluded={van.insuranceIncluded}
    achatHref={achatHref}
  />
)}

<YescapaReassurance />
```

**Step 4 : Vérifier visuellement**

- `http://localhost:3000/vanzon/location/yoni`
  - Bouton rose Yescapa visible et cliquable
  - Encadré réassurance présent sous le bouton
  - Si Yoni est aussi en vente dans Sanity : bouton "Acheter ce véhicule" visible
- `http://localhost:3000/vanzon/location/xalbat`
  - Même vérification

**Step 5 : Commit**

```bash
git add src/app/(site)/location/[slug]/page.tsx
git commit -m "feat: page location/slug avec Yescapa rose, bouton Acheter, réassurance"
```

---

## Task 5 : Vérification finale et nettoyage

**Step 1 : Build complet**

```bash
npm run build
```
Expected: 0 erreurs, 0 warnings TypeScript

**Step 2 : Lint**

```bash
npm run lint
```

**Step 3 : Checklist visuelle**

- [ ] Homepage : section vans sans FOUC, 2 cartes glassmorphism
- [ ] Carte van : bouton "Voir ce van" → `/location/[slug]`
- [ ] Page `/location/yoni` : galerie, sidebar sticky, bouton Yescapa rose
- [ ] Page `/location/yoni` : encadré réassurance clair
- [ ] Bouton "Acheter" visible uniquement si `offerType` inclut `"achat"`
- [ ] Mobile : responsive sur toutes les pages

**Step 4 : Commit final si ajustements**

```bash
git add -A
git commit -m "fix: ajustements visuels location section"
```
