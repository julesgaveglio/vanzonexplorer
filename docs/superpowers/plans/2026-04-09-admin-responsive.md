# Admin Dashboard Responsive Mobile-First — Plan d'implémentation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les ~43 pages du dashboard `/admin` entièrement responsive mobile-first via une foundation solide + 5 composants partagés réutilisables.

**Architecture:** Phase 1 fixe AdminShell (padding mobile) et AdminSidebar (touch targets). Phase 2 crée 5 composants partagés dans `_components/ui/`. Phase 3 applique les composants sur toutes les pages. Les pages qui délèguent à un Client Component nécessitent des fixes dans ce composant, pas dans le `page.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS (mobile-first)

**Spec de référence :** `docs/superpowers/specs/2026-04-09-admin-responsive-mobile-first.md`

**Vérification :** Pas de suite de tests — utiliser `npm run build` + `npm run lint` à chaque commit.

**Pages prioritaires à tester manuellement :** `/admin`, `/admin/backlinks`, `/admin/seo-report`

---

## Chunk 1 : Foundation + Composants partagés

### Task 1 : Fix AdminShell — supprimer paddingLeft sur mobile

**Fichiers :**
- Modifier : `src/app/admin/_components/AdminShell.tsx:38-39`

- [ ] **Step 1 : Remplacer le style inline par des classes Tailwind**

Dans `src/app/admin/_components/AdminShell.tsx`, trouver le `<div>` principal (ligne ~38) :

```tsx
// Avant :
<div
  className="flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out"
  style={{ paddingLeft: `${sidebarWidth}px` }}
>

// Après :
<div
  className={`flex flex-col min-h-screen lg:transition-[padding] lg:duration-300 ease-in-out ${
    collapsed ? 'lg:pl-[60px]' : 'lg:pl-[260px]'
  }`}
>
```

Supprimer la ligne `const sidebarWidth = collapsed ? 60 : 260;` qui devient inutile.

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build 2>&1 | tail -5
```
Expected : compilation sans erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/_components/AdminShell.tsx
git commit -m "fix(admin): supprimer paddingLeft sidebar sur mobile"
```

---

### Task 2 : Fix AdminSidebar — touch targets

**Fichiers :**
- Modifier : `src/app/admin/_components/AdminSidebar.tsx`

> **Note préalable :** Le `onClick={onClose}` est déjà implémenté sur tous les liens nav dans le fichier actuel. Seule la hauteur minimale des touch targets est à corriger.

- [ ] **Step 1 : Lire le fichier pour trouver la classe des liens**

Ouvrir `src/app/admin/_components/AdminSidebar.tsx`. Les liens de navigation utilisent un template literal conditionnel selon l'état `collapsed`. Chercher la chaîne `"relative flex items-center"` ou `"gap-2.5 px-3 py-2"` pour localiser le pattern de classe.

- [ ] **Step 2 : Ajouter min-h-[44px] sur les deux branches du conditionnel**

La classe des liens est conditionnelle selon `collapsed`. Dans les DEUX branches du conditionnel (expanded et collapsed), ajouter `min-h-[44px]` :

```tsx
// Trouver le conditionnel type :
collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2"

// Remplacer par :
collapsed ? "justify-center px-0 py-2.5 min-h-[44px] min-w-[44px]" : "gap-2.5 px-3 py-2 min-h-[44px]"
```

Ne pas dupliquer `justify-center` — il est déjà dans la branche collapsed.

- [ ] **Step 3 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "fix(admin): touch targets min-h-[44px] sidebar mobile"
```

---

### Task 3 : Créer AdminPageHeader

**Fichiers :**
- Créer : `src/app/admin/_components/ui/AdminPageHeader.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/app/admin/_components/ui/AdminPageHeader.tsx
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode; // affiché sous le titre, pas dans le h1
}

export default function AdminPageHeader({ title, subtitle, action, badge }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        {badge && <div className="mt-1">{badge}</div>}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2 : Build**

```bash
npm run build 2>&1 | tail -5
```

---

### Task 4 : Créer AdminKPIGrid

**Fichiers :**
- Créer : `src/app/admin/_components/ui/AdminKPIGrid.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/app/admin/_components/ui/AdminKPIGrid.tsx
interface AdminKPIGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6;
}

const colsMap: Record<2 | 3 | 4 | 6, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export default function AdminKPIGrid({ children, cols = 4 }: AdminKPIGridProps) {
  return (
    <div className={`grid gap-3 md:gap-4 ${colsMap[cols]}`}>
      {children}
    </div>
  );
}
```

---

### Task 5 : Créer AdminSection

**Fichiers :**
- Créer : `src/app/admin/_components/ui/AdminSection.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/app/admin/_components/ui/AdminSection.tsx
interface AdminSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function AdminSection({ title, children, className = '', noPadding = false }: AdminSectionProps) {
  return (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-slate-100 ${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>
      {title && (
        <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
```

---

### Task 6 : Créer AdminTableWrapper

**Fichiers :**
- Créer : `src/app/admin/_components/ui/AdminTableWrapper.tsx`

- [ ] **Step 1 : Créer le composant**

```tsx
// src/app/admin/_components/ui/AdminTableWrapper.tsx
interface AdminTableWrapperProps {
  children: React.ReactNode;
}

export default function AdminTableWrapper({ children }: AdminTableWrapperProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      {children}
    </div>
  );
}
```

---

### Task 7 : Créer AdminFilterBar + barrel export

**Fichiers :**
- Créer : `src/app/admin/_components/ui/AdminFilterBar.tsx`
- Créer : `src/app/admin/_components/ui/index.ts`

- [ ] **Step 1 : Créer AdminFilterBar**

```tsx
// src/app/admin/_components/ui/AdminFilterBar.tsx
interface AdminFilterBarProps {
  children: React.ReactNode;
}

export default function AdminFilterBar({ children }: AdminFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {children}
    </div>
  );
}
```

- [ ] **Step 2 : Créer le barrel export**

```ts
// src/app/admin/_components/ui/index.ts
export { default as AdminPageHeader } from './AdminPageHeader';
export { default as AdminKPIGrid } from './AdminKPIGrid';
export { default as AdminSection } from './AdminSection';
export { default as AdminTableWrapper } from './AdminTableWrapper';
export { default as AdminFilterBar } from './AdminFilterBar';
```

- [ ] **Step 3 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/app/admin/_components/ui/
git commit -m "feat(admin): 5 composants UI partagés responsive — AdminPageHeader, AdminKPIGrid, AdminSection, AdminTableWrapper, AdminFilterBar"
```

---

## Chunk 2 : Pages simples — wrappers et pages inline

> Ces pages ont leur contenu directement dans `page.tsx` (pas de Client Component dédié). Appliquer les règles de la spec directement.

**Règle universelle :**
- Premier `<div>` du `return` : `p-8` ou `p-6` → `p-4 md:p-6 lg:p-8`
- `<h1 className="text-3xl font-black">` → remplacer par `<AdminPageHeader title="..." />`
- `text-3xl` seul → `text-xl md:text-2xl lg:text-3xl`
- `grid-cols-X` (KPIs) → `<AdminKPIGrid cols={X}>`
- `bg-white rounded-2xl p-6` → `<AdminSection>`
- `<table>` → `<AdminTableWrapper><table>...</table></AdminTableWrapper>`

---

### Task 8 : Page Dashboard (`/admin`)

**Fichiers :**
- Modifier : `src/app/admin/(protected)/page.tsx`

> **Note :** Ce fichier est déjà partiellement responsive (`p-4 sm:p-6 lg:p-8`, `grid-cols-2 lg:grid-cols-4`). Lire le fichier en premier pour identifier ce qui reste à faire avant d'éditer.

- [ ] **Step 1 : Lire le fichier et vérifier l'état actuel**

```bash
head -160 "src/app/admin/(protected)/page.tsx"
```

Identifier :
- Le padding racine — si déjà `p-4 sm:p-6 lg:p-8` ou `p-4 md:p-6 lg:p-8` → **ne pas toucher**
- Le h1 — s'il contient un greeting dynamique (`firstName`) → **ne pas remplacer par AdminPageHeader**, laisser tel quel
- Les grilles KPI — si `grid-cols-2 lg:grid-cols-4` déjà présent → **ne pas toucher**
- Les tables — ajouter `<AdminTableWrapper>` uniquement si pas de `overflow-x-auto`

- [ ] **Step 2 : Appliquer uniquement les fixes manquants**

Ajouter l'import uniquement si des composants sont utilisés :
```tsx
import { AdminKPIGrid, AdminSection, AdminTableWrapper } from "@/app/admin/_components/ui";
```

Pour chaque `<table>` sans `overflow-x-auto` parent → wrapper dans `<AdminTableWrapper>`.

- [ ] **Step 3 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/page.tsx"
git commit -m "fix(admin/dashboard): AdminTableWrapper sur les tables"
```

---

### Task 9 : Pages simples à padding/header uniquement

> Ces pages ne contiennent qu'un wrapper mince autour d'un Client Component. Seul le padding et éventuellement le header page.tsx sont à corriger. Le contenu responsive est géré dans le Client Component (Task 14+).
>
> **EXCLUS de cette liste** (traités séparément dans Tasks 10-13) : `vans`, `blog`, `costs`, `pinterest`.

Pages concernées :
- `src/app/admin/(protected)/backlinks/page.tsx`
- `src/app/admin/(protected)/seo-report/page.tsx`
- `src/app/admin/(protected)/keywords/page.tsx` (pas de wrapper, délègue tout)
- `src/app/admin/(protected)/marketplace/page.tsx` (pas de wrapper, délègue tout)
- `src/app/admin/(protected)/road-trips/page.tsx`
- `src/app/admin/(protected)/agents/page.tsx`
- `src/app/admin/(protected)/performance/page.tsx`
- `src/app/admin/(protected)/marketing/page.tsx`
- `src/app/admin/(protected)/settings/page.tsx`
- `src/app/admin/(protected)/spots/page.tsx`
- `src/app/admin/(protected)/testimonials/page.tsx`
- `src/app/admin/(protected)/van-owner-leads/page.tsx`
- `src/app/admin/(protected)/media/page.tsx`
- `src/app/admin/(protected)/seo/page.tsx`
- `src/app/admin/(protected)/architecture/page.tsx`
- `src/app/admin/(protected)/formation/queue/page.tsx`
- `src/app/admin/(protected)/formation/cartes/page.tsx`
- `src/app/admin/(protected)/formation/competitors/page.tsx`
- `src/app/admin/(protected)/formation/keywords/page.tsx`
- `src/app/admin/(protected)/club/page.tsx`
- `src/app/admin/(protected)/club/marques/page.tsx`
- `src/app/admin/(protected)/club/produits/page.tsx`
- `src/app/admin/(protected)/club/onboarding/page.tsx`
- `src/app/admin/(protected)/club/prospection/page.tsx`
- `src/app/admin/(protected)/marketplace-prospection/page.tsx`
- `src/app/admin/(protected)/location-prospection/page.tsx`

- [ ] **Step 1 : Pour chaque page.tsx ci-dessus, appliquer le pattern**

Pour chaque fichier, faire dans l'ordre :
1. Lire le fichier
2. Remplacer `p-8` ou `p-6` (premier div racine du return) par `p-4 md:p-6 lg:p-8`
3. Si la page a un `<h1>` inline, le remplacer par `<AdminPageHeader title="..." subtitle="..." />`
4. Pour backlinks/page.tsx spécifiquement :

```tsx
// Avant :
<div className="p-8">
  <div className="mb-8">
    <p className="text-slate-400 text-sm font-medium mb-1">Système / SEO</p>
    <h1 className="text-3xl font-black text-slate-900">Backlinks SEO</h1>
    <p className="text-slate-500 mt-1">Discovery, outreach et suivi des backlinks obtenus</p>
  </div>
  <BacklinksClient initialData={data} />
</div>

// Après :
import { AdminPageHeader } from "@/app/admin/_components/ui";
// ...
<div className="p-4 md:p-6 lg:p-8">
  <AdminPageHeader
    title="Backlinks SEO"
    subtitle="Discovery, outreach et suivi des backlinks obtenus"
  />
  <BacklinksClient initialData={data} />
</div>
```

5. Pour seo-report/page.tsx :

```tsx
// Avant :
<div className="p-6 max-w-4xl mx-auto">
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-slate-900">Générateur de Rapport SEO</h1>
    <p className="text-sm text-slate-500 mt-1">...</p>
  </div>
  <SeoReportClient />
</div>

// Après :
import { AdminPageHeader } from "@/app/admin/_components/ui";
// ...
<div className="p-4 md:p-6 max-w-4xl mx-auto">
  <AdminPageHeader
    title="Générateur de Rapport SEO"
    subtitle="Analyse complète d'un site — performance, on-page, autorité, concurrents et recommandations IA."
  />
  <SeoReportClient />
</div>
```

- [ ] **Step 2 : Build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3 : Commit — uniquement les fichiers de cette task (pas vans/blog/costs/pinterest)**

```bash
git add \
  "src/app/admin/(protected)/backlinks/page.tsx" \
  "src/app/admin/(protected)/seo-report/page.tsx" \
  "src/app/admin/(protected)/keywords/page.tsx" \
  "src/app/admin/(protected)/marketplace/page.tsx" \
  "src/app/admin/(protected)/road-trips/page.tsx" \
  "src/app/admin/(protected)/agents/page.tsx" \
  "src/app/admin/(protected)/performance/page.tsx" \
  "src/app/admin/(protected)/marketing/page.tsx" \
  "src/app/admin/(protected)/settings/page.tsx" \
  "src/app/admin/(protected)/spots/page.tsx" \
  "src/app/admin/(protected)/testimonials/page.tsx" \
  "src/app/admin/(protected)/van-owner-leads/page.tsx" \
  "src/app/admin/(protected)/media/page.tsx" \
  "src/app/admin/(protected)/seo/page.tsx" \
  "src/app/admin/(protected)/architecture/page.tsx" \
  "src/app/admin/(protected)/formation/queue/page.tsx" \
  "src/app/admin/(protected)/formation/cartes/page.tsx" \
  "src/app/admin/(protected)/formation/competitors/page.tsx" \
  "src/app/admin/(protected)/formation/keywords/page.tsx" \
  "src/app/admin/(protected)/club/page.tsx" \
  "src/app/admin/(protected)/club/marques/page.tsx" \
  "src/app/admin/(protected)/club/produits/page.tsx" \
  "src/app/admin/(protected)/club/onboarding/page.tsx" \
  "src/app/admin/(protected)/club/prospection/page.tsx" \
  "src/app/admin/(protected)/marketplace-prospection/page.tsx" \
  "src/app/admin/(protected)/location-prospection/page.tsx"
git commit -m "fix(admin): padding responsive mobile-first + AdminPageHeader sur pages wrappers"
```

---

### Task 10 : Vans page — tables + header

**Fichiers :**
- Modifier : `src/app/admin/(protected)/vans/page.tsx`

- [ ] **Step 1 : Lire le fichier complet, puis appliquer**

```tsx
import { AdminPageHeader, AdminSection, AdminTableWrapper } from "@/app/admin/_components/ui";
```

- Padding racine : `p-4 md:p-6 lg:p-8`
- Header : `<AdminPageHeader title="Vans" action={<Link href="/studio">Gérer dans Sanity →</Link>} />`
- Chaque section `<div className="bg-white rounded-2xl ...">` → `<AdminSection title="Location">` / `<AdminSection title="Achat / Revente">`
- Chaque `<table>` → `<AdminTableWrapper><table>...</table></AdminTableWrapper>`

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/vans/page.tsx"
git commit -m "fix(admin/vans): responsive — AdminPageHeader + AdminTableWrapper"
```

---

### Task 11 : Blog page — KPI grid + sections

**Fichiers :**
- Modifier : `src/app/admin/(protected)/blog/page.tsx`

- [ ] **Step 1 : Appliquer les composants**

```tsx
import { AdminPageHeader, AdminKPIGrid, AdminSection, AdminFilterBar } from "@/app/admin/_components/ui";
```

- Padding : `p-4 md:p-6 lg:p-8`
- Header title "Blog & Articles" → `<AdminPageHeader title="Blog & Articles" subtitle="..." />`
- Grille KPI (published/pending/etc.) → `<AdminKPIGrid cols={4}>`
- Sections "File d'articles" / "Articles publiés" → `<AdminSection title="...">`
- Barre de filtres → `<AdminFilterBar>`

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/blog/page.tsx"
git commit -m "fix(admin/blog): responsive — AdminKPIGrid + AdminSection + AdminFilterBar"
```

---

### Task 12 : Costs page — KPI grid + tables + chart

**Fichiers :**
- Modifier : `src/app/admin/(protected)/costs/page.tsx`

- [ ] **Step 1 : Appliquer les composants**

```tsx
import { AdminPageHeader, AdminKPIGrid, AdminSection, AdminTableWrapper, AdminFilterBar } from "@/app/admin/_components/ui";
```

- Padding : `p-4 md:p-6 lg:p-8`
- Header "Coûts" → `<AdminPageHeader title="Coûts" subtitle="Suivi des dépenses par outil" />`
- KPI grid 4 stats → `<AdminKPIGrid cols={4}>`
- Grille "Répartition par outil" (6 cards) → `<AdminKPIGrid cols={6}>` dans `<AdminSection title="Répartition par outil">`
- Section chart → `<AdminSection title="Évolution des coûts">`
- Tables → `<AdminTableWrapper>` autour de chaque `<table>`
- Barres filtres → `<AdminFilterBar>`
- Sur les `<input>` de recherche : ajouter `w-full sm:w-44`

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/costs/page.tsx"
git commit -m "fix(admin/costs): responsive — AdminKPIGrid + AdminTableWrapper + AdminSection"
```

---

### Task 13 : Pinterest page — stack vertical mobile

**Fichiers :**
- Modifier : `src/app/admin/(protected)/pinterest/page.tsx`

- [ ] **Step 1 : Appliquer les composants**

```tsx
import { AdminPageHeader, AdminSection } from "@/app/admin/_components/ui";
```

- Padding (wrapper racine `space-y-8`) : ajouter `p-4 md:p-6 lg:p-8` autour ou sur le div racine
- Header : remplacer le `<div className="flex items-start justify-between">` par `<AdminPageHeader title="Pinterest Strategy" badge={<span>...</span>} action={<PinterestResearchButton />} />`
- Le `<div className="grid grid-cols-2 gap-8">` qui contient charts et queue → `<div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">`

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/pinterest/page.tsx"
git commit -m "fix(admin/pinterest): responsive — stack mobile + AdminPageHeader"
```

---

## Chunk 3 : Client Components + pages complexes

> La plupart des pages admin délèguent à des Client Components. C'est dans ces composants que les tables, filtres et grilles se trouvent. Appliquer les mêmes règles.

---

### Task 14 : BacklinksClient — kanban responsive

**Fichiers :**
- Modifier : `src/app/admin/(protected)/backlinks/_components/BacklinksClient.tsx`

- [ ] **Step 1 : Lire le fichier, identifier le layout kanban**

Le kanban a probablement une structure type :
```tsx
<div className="flex gap-4"> // colonnes kanban côte à côte
  <div>Découvert</div>
  <div>Contacté</div>
  <div>Relancé</div>
  <div>Obtenu</div>
</div>
```

- [ ] **Step 2 : Rendre le kanban scrollable sur mobile**

```tsx
// Avant :
<div className="flex gap-4">

// Après :
<div className="flex flex-col lg:flex-row gap-4 overflow-x-auto">
```

Chaque colonne kanban : ajouter `min-w-[280px] lg:min-w-0 lg:flex-1` pour maintenir une largeur minimale sur mobile et un scroll horizontal propre.

- [ ] **Step 3 : Ajouter AdminTableWrapper sur les tables dans ce composant**

```tsx
import { AdminTableWrapper, AdminFilterBar } from "@/app/admin/_components/ui";
```

Wrapper chaque `<table>` présent dans ce composant.

- [ ] **Step 4 : Tester le drag-and-drop**

Vérifier visuellement que le drag-and-drop des cards kanban fonctionne toujours après modification. Tester sur `npm run dev`.

- [ ] **Step 5 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/backlinks/"
git commit -m "fix(admin/backlinks): kanban responsive mobile — flex-col lg:flex-row + scroll"
```

---

### Task 15 : MarketplaceClient — tables + cards responsive

**Fichiers :**
- Modifier : `src/app/admin/(protected)/marketplace/_components/MarketplaceClient.tsx`

- [ ] **Step 1 : Importer et appliquer**

```tsx
import { AdminPageHeader, AdminSection, AdminTableWrapper, AdminFilterBar } from "@/app/admin/_components/ui";
```

- Header marketplace → `<AdminPageHeader title="Fiches Marketplace" subtitle="..." action={...} />`
- Padding racine → `p-4 md:p-6 lg:p-8`
- Tables → `<AdminTableWrapper>`
- Filtres → `<AdminFilterBar>` avec `w-full sm:w-44` sur les inputs
- Cards grille → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/marketplace/"
git commit -m "fix(admin/marketplace): responsive — AdminTableWrapper + AdminFilterBar"
```

---

### Task 16 : Remaining Client Components — batch

> Ces Client Components suivent tous le même pattern. Les traiter en batch.

**Fichiers à modifier :**

Pour chaque fichier, lire d'abord son contenu pour adapter le pattern exact.

- `src/app/admin/(protected)/blog/published/page.tsx`
- `src/app/admin/(protected)/keywords/KeywordsClient.tsx`
- `src/app/admin/(protected)/performance/PerformanceClient.tsx`
- `src/app/admin/(protected)/seo/SeoClient.tsx`
- `src/app/admin/(protected)/seo-report/SeoReportClient.tsx`
- `src/app/admin/(protected)/road-trips/ReviewActions.tsx`
- `src/app/admin/(protected)/agents/AgentsClient.tsx`
- `src/app/admin/(protected)/marketing/MarketingClient.tsx`
- `src/app/admin/(protected)/club/ClubClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/club/marques/MarquesClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/club/produits/ProduitsClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/club/prospection/ProspectionClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/formation/queue/FormationQueueClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/formation/competitors/_components/CompetitorsClient.tsx`
- `src/app/admin/(protected)/formation/keywords/KeywordsClient.tsx` (ou équivalent — lire le dossier)
- `src/app/admin/(protected)/van-owner-leads/VanOwnerLeadsClient.tsx` (ou équivalent — lire le dossier)

> **Pour les fichiers marqués "lire le dossier"** : avant d'éditer, lister le contenu du dossier avec `ls` pour trouver le nom exact du Client Component.

- [ ] **Step 1 : Pour chaque composant/page, appliquer la règle universelle**

Pour CHAQUE fichier dans la liste ci-dessus :

1. Lire le fichier
2. Ajouter l'import : `import { AdminPageHeader, AdminKPIGrid, AdminSection, AdminTableWrapper, AdminFilterBar } from "@/app/admin/_components/ui";`
3. Appliquer les règles :
   - `p-8` / `p-6` (premier div du return) → `p-4 md:p-6 lg:p-8`
   - `text-3xl` ou `text-2xl` sur h1 → `text-xl md:text-2xl lg:text-3xl`
   - Bloc `<h1> + <p subtitle>` → `<AdminPageHeader title="..." subtitle="..." />`
   - `grid grid-cols-X` (KPIs) → `<AdminKPIGrid cols={X}>`
   - `bg-white rounded-2xl p-6` → `<AdminSection>`
   - `<table>` → `<AdminTableWrapper><table>...</table></AdminTableWrapper>`
   - `flex gap-2` (filtres) → `<AdminFilterBar>`
   - `w-44` sur inputs → `w-full sm:w-44`
   - `grid-cols-X` (non-KPI) → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-X`
   - `flex gap-X` pour cartes côte à côte → `flex flex-col sm:flex-row gap-X`

- [ ] **Step 2 : Build après chaque groupe logique**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3 : Commits groupés par section**

```bash
git add "src/app/admin/(protected)/keywords/" "src/app/admin/(protected)/performance/" "src/app/admin/(protected)/seo/"
git commit -m "fix(admin): responsive SEO + Keywords + Performance"

git add "src/app/admin/(protected)/club/" "src/app/admin/(protected)/formation/"
git commit -m "fix(admin): responsive Club + Formation"

git add "src/app/admin/(protected)/marketing/" "src/app/admin/(protected)/agents/" "src/app/admin/(protected)/road-trips/"
git commit -m "fix(admin): responsive Marketing + Agents + Road Trips"

git add "src/app/admin/(protected)/spots/" "src/app/admin/(protected)/testimonials/" "src/app/admin/(protected)/media/" "src/app/admin/(protected)/van-owner-leads/" "src/app/admin/(protected)/location-prospection/" "src/app/admin/(protected)/marketplace-prospection/"
git commit -m "fix(admin): responsive pages secondaires"
```

---

### Task 17 : Architecture page — touch-action mobile

**Fichiers :**
- Modifier : `src/app/admin/(protected)/architecture/ArchitectureClient.tsx` (ou équivalent)

- [ ] **Step 1 : Ajouter touch-action sur le conteneur React Flow**

Trouver le `<div>` qui contient le graphe React Flow. Ajouter :
```tsx
// Sur le wrapper du graphe :
style={{ touchAction: 'pan-x pan-y' }}
// ou via className si Tailwind le supporte :
className="... touch-pan-x touch-pan-y"
```

- [ ] **Step 2 : Padding page + header**

Appliquer `p-4 md:p-6 lg:p-8` et `<AdminPageHeader>` sur la page architecture.

- [ ] **Step 3 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/architecture/"
git commit -m "fix(admin/architecture): touch-action mobile + padding responsive"
```

---

### Task 18 : Éditeur SSE — stack mobile

**Fichiers :**
- Modifier : `src/app/admin/(protected)/seo/editeur/[id]/_components/ArticleEditorClient.tsx` (layout deux colonnes)
- Modifier : `src/app/admin/(protected)/seo/editeur/page.tsx` (padding wrapper)

- [ ] **Step 1 : Layout deux colonnes → stack sur mobile**

Trouver le layout deux colonnes type :
```tsx
<div className="grid grid-cols-2 gap-6">
  <div> {/* Panel de contrôle */} </div>
  <div> {/* Rendu/preview */} </div>
</div>
```

Remplacer par :
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
  <div> {/* Panel de contrôle — en premier = en haut sur mobile */} </div>
  <div> {/* Rendu/preview */} </div>
</div>
```

- [ ] **Step 2 : Build + commit**

```bash
npm run build 2>&1 | tail -5
git add "src/app/admin/(protected)/seo/editeur/"
git commit -m "fix(admin/editeur): layout deux colonnes responsive mobile"
```

---

### Task 19 : Vérification manuelle finale + build propre

- [ ] **Step 1 : Build complet**

```bash
npm run build
```
Expected : 0 erreur TypeScript, 0 erreur ESLint.

- [ ] **Step 2 : Lint**

```bash
npm run lint
```
Expected : aucune erreur.

- [ ] **Step 3 : Test manuel sur 3 pages prioritaires**

Démarrer `npm run dev`, ouvrir DevTools → mobile 375px (iPhone SE) et vérifier :

✅ `/admin` — grille KPI en 2 colonnes, sidebar ferme après navigation
✅ `/admin/backlinks` — kanban scrollable horizontalement, pas de débordement
✅ `/admin/seo-report` — header correct, contenu lisible

- [ ] **Step 4 : Commit final si besoin**

```bash
git add -A
git commit -m "fix(admin): responsive mobile-first — build propre final"
```

---

## Checklist complète des fichiers

### Foundation
- [ ] `src/app/admin/_components/AdminShell.tsx`
- [ ] `src/app/admin/_components/AdminSidebar.tsx`
- [ ] `src/app/admin/_components/ui/AdminPageHeader.tsx` (créer)
- [ ] `src/app/admin/_components/ui/AdminKPIGrid.tsx` (créer)
- [ ] `src/app/admin/_components/ui/AdminSection.tsx` (créer)
- [ ] `src/app/admin/_components/ui/AdminTableWrapper.tsx` (créer)
- [ ] `src/app/admin/_components/ui/AdminFilterBar.tsx` (créer)
- [ ] `src/app/admin/_components/ui/index.ts` (créer)

### Pages inline
- [ ] `src/app/admin/(protected)/page.tsx`
- [ ] `src/app/admin/(protected)/vans/page.tsx`
- [ ] `src/app/admin/(protected)/blog/page.tsx`
- [ ] `src/app/admin/(protected)/costs/page.tsx`
- [ ] `src/app/admin/(protected)/pinterest/page.tsx`
- [ ] `src/app/admin/(protected)/backlinks/page.tsx`
- [ ] `src/app/admin/(protected)/seo-report/page.tsx`

### Pages wrappers (padding + header seulement)
- [ ] `src/app/admin/(protected)/keywords/page.tsx`
- [ ] `src/app/admin/(protected)/marketplace/page.tsx`
- [ ] `src/app/admin/(protected)/road-trips/page.tsx`
- [ ] `src/app/admin/(protected)/agents/page.tsx`
- [ ] `src/app/admin/(protected)/performance/page.tsx`
- [ ] `src/app/admin/(protected)/marketing/page.tsx`
- [ ] `src/app/admin/(protected)/settings/page.tsx`
- [ ] `src/app/admin/(protected)/spots/page.tsx`
- [ ] `src/app/admin/(protected)/testimonials/page.tsx`
- [ ] `src/app/admin/(protected)/van-owner-leads/page.tsx`
- [ ] `src/app/admin/(protected)/media/page.tsx`
- [ ] `src/app/admin/(protected)/seo/page.tsx`
- [ ] `src/app/admin/(protected)/architecture/page.tsx`
- [ ] `src/app/admin/(protected)/formation/queue/page.tsx`
- [ ] `src/app/admin/(protected)/formation/cartes/page.tsx`
- [ ] `src/app/admin/(protected)/formation/competitors/page.tsx`
- [ ] `src/app/admin/(protected)/formation/keywords/page.tsx`
- [ ] `src/app/admin/(protected)/club/page.tsx`
- [ ] `src/app/admin/(protected)/club/marques/page.tsx`
- [ ] `src/app/admin/(protected)/club/produits/page.tsx`
- [ ] `src/app/admin/(protected)/club/onboarding/page.tsx`
- [ ] `src/app/admin/(protected)/club/prospection/page.tsx`
- [ ] `src/app/admin/(protected)/marketplace-prospection/page.tsx`
- [ ] `src/app/admin/(protected)/location-prospection/page.tsx`

### Client Components (responsive interne)
- [ ] `src/app/admin/(protected)/backlinks/_components/BacklinksClient.tsx`
- [ ] `src/app/admin/(protected)/marketplace/_components/MarketplaceClient.tsx`
- [ ] `src/app/admin/(protected)/keywords/KeywordsClient.tsx`
- [ ] `src/app/admin/(protected)/seo-report/SeoReportClient.tsx`
- [ ] `src/app/admin/(protected)/architecture/ArchitectureClient.tsx`
- [ ] `src/app/admin/(protected)/seo/editeur/` (tous)
- [ ] `src/app/admin/(protected)/performance/_components/` (tous)
- [ ] `src/app/admin/(protected)/seo/_components/` (tous)
- [ ] `src/app/admin/(protected)/road-trips/_components/` (tous)
- [ ] `src/app/admin/(protected)/agents/_components/` (si existants)
- [ ] `src/app/admin/(protected)/marketing/_components/` (tous)
- [ ] `src/app/admin/(protected)/club/_components/` (tous)
- [ ] `src/app/admin/(protected)/formation/_components/` (tous)
