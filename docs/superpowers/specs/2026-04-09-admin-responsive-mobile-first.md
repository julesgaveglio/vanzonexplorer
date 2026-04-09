# Spec — Admin Dashboard Responsive Mobile-First

**Date :** 2026-04-09
**Statut :** Validé par Jules

---

## Objectif

Rendre les 39+ pages du dashboard admin (`/admin/*`) entièrement responsive en mobile-first. Chaque future page admin construite avec les composants partagés sera naturellement responsive sans effort supplémentaire.

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

**Fix** : Appliquer le `paddingLeft` uniquement sur `lg:` avec une CSS custom property :

```tsx
// Remplacer le style inline par :
<div
  className="flex flex-col min-h-screen lg:transition-[padding] lg:duration-300 ease-in-out"
  style={{ ['--sidebar-w' as string]: `${sidebarWidth}px` } as React.CSSProperties}
>
```

Et via une classe utilitaire dans globals.css :
```css
@media (min-width: 1024px) {
  .admin-main { padding-left: var(--sidebar-w, 260px); }
}
```

Ou plus simplement — passer `sidebarWidth` en prop et gérer avec classes conditionnelles :
```tsx
// Mobile : paddingLeft = 0 (overlay)
// Desktop : paddingLeft = sidebarWidth
const paddingStyle = typeof window !== 'undefined' && window.innerWidth >= 1024
  ? { paddingLeft: `${sidebarWidth}px` }
  : {};
```

**Solution retenue** : ajouter `className="lg:pl-[260px]"` ou gérer via une classe appliquée conditionnellement selon `collapsed` uniquement sur lg+. Utiliser un wrapper `<div className="hidden lg:block">` pour les effets de transition desktop.

**Implementation précise** :
```tsx
<div
  className="flex flex-col min-h-screen"
  style={{ paddingLeft: window?.innerWidth >= 1024 ? sidebarWidth : 0 }}
>
```

Ou encore plus simple avec Tailwind seul : utiliser `useMediaQuery` ou détecter via classe CSS :
```tsx
// Classe CSS-only :
<div className={`flex flex-col min-h-screen lg:transition-[padding] lg:duration-300 ${
  !collapsed ? 'lg:pl-[260px]' : 'lg:pl-[60px]'
}`}>
```
Ce pattern est le plus simple et le plus propre. **C'est ce qu'on implémente.**

### AdminSidebar (`src/app/admin/_components/AdminSidebar.tsx`)

**Fix 1 — Touch targets** : Tous les `<Link>` de nav → `min-h-[44px]` (actuellement les items n'ont pas de hauteur minimale définie).

**Fix 2 — Auto-close** : Appeler `onClose()` dans le `onClick` de chaque `<Link>` de navigation sur mobile.

**Fix 3 — Scroll** : Ajouter `overflow-y-auto` sur le conteneur des nav items pour les petits écrans.

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
Layout :
- Mobile : titre + sous-titre en colonne, action en dessous (full-width si bouton)
- Desktop : titre + action sur la même ligne (`flex justify-between`)

### `AdminKPIGrid.tsx`
```tsx
interface Props {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 6; // colonnes desktop max (défaut: 4)
}
```
Layout :
- Mobile : `grid-cols-2`
- sm : `grid-cols-3` (si cols >= 3)
- lg : `grid-cols-{cols}`

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
Layout : `bg-white rounded-xl md:rounded-2xl border border-slate-100 p-4 md:p-6`

### `AdminTableWrapper.tsx`
Wrapper pour toutes les `<table>` de l'admin.
```tsx
interface Props {
  children: React.ReactNode;
}
```
Layout :
```tsx
<div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
  {children}
</div>
```
Cela permet aux tables de s'étendre jusqu'aux bords sur mobile avec un scroll horizontal propre.

### `AdminFilterBar.tsx`
Wrapper pour les barres de filtres (boutons + inputs de recherche).
```tsx
interface Props {
  children: React.ReactNode;
}
```
Layout :
```tsx
<div className="flex flex-wrap gap-2 items-center">
  {children}
</div>
```
Les `<input>` de recherche : `w-full sm:w-44` au lieu de `w-44` fixe.

---

## Phase 3 — Application sur les 39 pages

### Règles universelles appliquées sur toutes les pages

| Avant | Après |
|-------|-------|
| `p-8` ou `p-6` (padding page) | `p-4 md:p-6 lg:p-8` |
| `text-3xl` titre page | `text-xl md:text-2xl lg:text-3xl` |
| `grid-cols-4` KPI | `AdminKPIGrid cols={4}` |
| `<h1>Titre</h1> + <button>` | `<AdminPageHeader title="..." action={<button>} />` |
| `<table>...</table>` | `<AdminTableWrapper><table>...</table></AdminTableWrapper>` |
| Section card : `bg-white rounded-2xl p-6` | `<AdminSection>` |
| Barre filtres : `flex gap-2` | `<AdminFilterBar>` |

### Traitements spéciaux

**Kanban Backlinks** (`/admin/backlinks`) : Les colonnes kanban → `flex-col md:flex-row` + scroll horizontal sur mobile.

**Graphe Architecture** (`/admin/architecture`) : Déjà en `position: absolute`, responsive via viewport. Ajouter `touch-action: pan-x pan-y` pour le pinch/zoom mobile.

**Éditeur SSE** (`/admin/seo/editeur`) : Layout deux colonnes → stack sur mobile. Panel de contrôle au-dessus du rendu.

**SEO Report** (`/admin/seo-report`) : Sections KPI + charts → `AdminKPIGrid` + charts responsives (ajouter `width: "100%"` aux recharts si utilisés).

**Pinterest** (`/admin/pinterest`) : Charts + queue → stack vertical sur mobile.

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
| Créer | `src/app/admin/_components/ui/index.ts` (barrel export) |
| Modifier | Toutes les pages dans `src/app/admin/(protected)/` |

---

## Critères de succès

- Sur un écran 375px (iPhone SE), toutes les pages admin sont utilisables sans scroll horizontal involontaire
- La sidebar s'ouvre/ferme correctement sur mobile et se ferme après navigation
- Le contenu principal n'est pas décalé par le padding sidebar sur mobile
- Tous les boutons/liens ont une zone de tap ≥ 44px
- Les tables sont scrollables horizontalement sans casser le layout
- Les grilles KPI affichent 2 colonnes sur mobile
- Chaque future page utilisant les composants UI partagés est responsive par défaut
