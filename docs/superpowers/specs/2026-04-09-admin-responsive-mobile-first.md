# Spec — Admin Dashboard Responsive Mobile-First

**Date :** 2026-04-09
**Statut :** Validé par Jules

---

## Objectif

Rendre les ~43 pages du dashboard admin (`/admin/*`) entièrement responsive en mobile-first. Chaque future page admin construite avec les composants partagés sera naturellement responsive sans effort supplémentaire.

---

## Principes directeurs

- **Mobile-first** : les styles de base ciblent mobile, les overrides ciblent desktop (`md:`, `lg:`)
- **Touch-friendly** : zones cliquables ≥ 44px
- **Zéro refonte UX** : on adapte le layout existant, on ne change pas les fonctionnalités
- **Composants partagés** : tout pattern répété devient un composant dans `src/app/admin/_components/ui/`
- Pages complexes (kanban backlinks, graphe architecture) : responsive de base garanti, pas de refonte UX profonde

---

## Phase 1 — Foundation : AdminShell + AdminSidebar

### AdminShell (`src/app/admin/_components/AdminShell.tsx`)

**Problème** : `style={{ paddingLeft: \`${sidebarWidth}px\` }}` s'applique sur tous les écrans. Sur mobile, la sidebar est un overlay — le padding pousse le contenu inutilement.

**Solution retenue — Tailwind classes conditionnelles (CSS-only, SSR-safe) :**

Remplacer le `style` inline par des classes Tailwind conditionnelles basées sur `collapsed` :

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

- Sur mobile (< lg) : `paddingLeft = 0` — la sidebar est un overlay, aucun décalage
- Sur desktop (≥ lg) : `paddingLeft = 60px` (collapsed) ou `260px` (expanded)
- La transition ne s'applique que sur desktop (`lg:transition-[padding]`) pour éviter un flash sur mobile

**Note** : Ne pas utiliser `window.innerWidth` — SSR-unsafe dans Next.js 14.

---

### AdminSidebar (`src/app/admin/_components/AdminSidebar.tsx`)

**Fix 1 — Touch targets** : Tous les `<Link>` et `<button>` de nav → ajouter `min-h-[44px]` pour respecter les guidelines touch iOS/Android.

**Fix 2 — Auto-close** : Vérifier que `onClose()` est bien appelé dans le `onClick` de **tous** les `<Link>` de navigation (certains items récents pourraient ne pas l'avoir). Pattern attendu :
```tsx
<Link href={item.href} onClick={() => onClose()}>
```

**Fix 3 — Scroll** : `overflow-y-auto` existe déjà sur le conteneur nav. Vérifier uniquement que ce comportement est préservé après les autres modifications.

---

## Phase 2 — Composants UI partagés

Créer dans `src/app/admin/_components/ui/` :

### `AdminPageHeader.tsx`
```tsx
interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode; // bouton "Ajouter", "Exporter", etc.
  badge?: React.ReactNode;
}
```
Rendu :
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
  <div>
    <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900">{title}</h1>
    {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    {badge}
  </div>
  {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
</div>
```

### `AdminKPIGrid.tsx`
```tsx
interface Props {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6; // colonnes desktop max (défaut: 4)
}
```
Mapping des classes Tailwind selon `cols` :

| `cols` | mobile | sm | lg |
|--------|--------|----|----|
| 2 | `grid-cols-2` | `grid-cols-2` | `grid-cols-2` |
| 3 | `grid-cols-2` | `grid-cols-3` | `grid-cols-3` |
| 4 | `grid-cols-2` | `grid-cols-3` | `grid-cols-4` |
| 6 | `grid-cols-2` | `grid-cols-3` | `grid-cols-6` |

Rendu :
```tsx
const colsMap = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

<div className={`grid gap-3 md:gap-4 ${colsMap[cols ?? 4]}`}>
  {children}
</div>
```

### `AdminSection.tsx`
Wrapper carte standard pour les blocs de contenu.
```tsx
interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}
```
Rendu :
```tsx
<div className={`bg-white rounded-xl md:rounded-2xl border border-slate-100 ${noPadding ? '' : 'p-4 md:p-6'} ${className ?? ''}`}>
  {title && <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">{title}</h2>}
  {children}
</div>
```

### `AdminTableWrapper.tsx`
Wrapper pour toutes les `<table>` de l'admin. Permet un scroll horizontal propre sur mobile en étendant la table jusqu'aux bords de l'écran.
```tsx
interface Props {
  children: React.ReactNode;
}
```
Rendu :
```tsx
<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  {children}
</div>
```

### `AdminFilterBar.tsx`
Wrapper pour les barres de filtres (boutons + inputs de recherche). Les enfants `<input>` doivent porter la classe `w-full sm:w-44` eux-mêmes (le wrapper ne la porte pas).
```tsx
interface Props {
  children: React.ReactNode;
}
```
Rendu :
```tsx
<div className="flex flex-wrap gap-2 items-center">
  {children}
</div>
```

### `index.ts` (barrel export)
```ts
export { default as AdminPageHeader } from './AdminPageHeader';
export { default as AdminKPIGrid } from './AdminKPIGrid';
export { default as AdminSection } from './AdminSection';
export { default as AdminTableWrapper } from './AdminTableWrapper';
export { default as AdminFilterBar } from './AdminFilterBar';
```

---

## Phase 3 — Application sur les ~43 pages

### Règle universelle : padding de page

Appliquer sur le **`<div>` racine du contenu de chaque page** (le premier `<div>` enfant direct du `return`) :

```
p-4 md:p-6 lg:p-8
```

### Règles de remplacement systématiques

| Pattern actuel | Remplacer par |
|----------------|---------------|
| `text-2xl` ou `text-3xl` sur titre H1 | `text-xl md:text-2xl lg:text-3xl` |
| KPI grid inline `grid grid-cols-4 gap-4` | `<AdminKPIGrid cols={4}>` |
| `<h1>Titre</h1>` + bouton action côte à côte | `<AdminPageHeader title="..." action={...} />` |
| `<table>...</table>` | `<AdminTableWrapper><table>...</table></AdminTableWrapper>` |
| Section card `bg-white rounded-2xl p-6` | `<AdminSection>` |
| Barre filtres `flex gap-2` | `<AdminFilterBar>` |
| `grid-cols-3` ou `grid-cols-X` (non-KPI) | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-X` |
| `flex gap-4` pour cartes côte à côte | `flex flex-col sm:flex-row gap-4` |

### Traitements spéciaux

**Kanban Backlinks** (`/admin/backlinks`) : Colonnes kanban → `flex-col lg:flex-row` + `overflow-x-auto`. Tester que le drag-and-drop fonctionne toujours après la modification.

**Graphe Architecture** (`/admin/architecture`) : Déjà `position: absolute` + viewport. Ajouter `touch-action: pan-x pan-y` sur le conteneur React Flow pour le pinch/zoom mobile.

**Éditeur SSE** (`/admin/seo/editeur`) : Layout deux colonnes → `flex-col lg:flex-row`. Panel de contrôle en premier (au-dessus du rendu sur mobile).

**SEO Report** (`/admin/seo-report`) : Sections KPI → `AdminKPIGrid`. Si recharts utilisé, ajouter `width="100%"` et `aspect` au lieu de hauteur fixe.

**Pinterest** (`/admin/pinterest`) : Charts + queue → `flex-col` sur mobile, `grid-cols-2` sur lg.

---

## Fichiers touchés

| Action | Fichier |
|--------|---------|
| Modifier | `src/app/admin/_components/AdminShell.tsx` |
| Modifier | `src/app/admin/_components/AdminSidebar.tsx` |
| Créer | `src/app/admin/_components/ui/AdminPageHeader.tsx` |
| Créer | `src/app/admin/_components/ui/AdminKPIGrid.tsx` |
| Créer | `src/app/admin/_components/ui/AdminSection.tsx` |
| Créer | `src/app/admin/_components/ui/AdminTableWrapper.tsx` |
| Créer | `src/app/admin/_components/ui/AdminFilterBar.tsx` |
| Créer | `src/app/admin/_components/ui/index.ts` |
| Modifier | Toutes les pages dans `src/app/admin/(protected)/` (~43 fichiers) |

---

## Critères de succès

- Sur un écran 375px (iPhone SE), toutes les pages admin sont utilisables sans scroll horizontal involontaire
- La sidebar s'ouvre/ferme sur mobile et se ferme automatiquement après navigation
- Le contenu principal n'est pas décalé sur mobile (paddingLeft = 0)
- Tous les boutons/liens ont une zone de tap ≥ 44px
- Les tables sont scrollables horizontalement sans casser le layout
- Les grilles KPI affichent 2 colonnes sur mobile, 3 sur tablette, max sur desktop
- Chaque future page utilisant les composants UI partagés est responsive par défaut
