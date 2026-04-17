---
name: Patterns responsive admin Vanzon
description: Règles mobile-first à appliquer sur toutes les pages admin — composants partagés, breakpoints, touch targets
type: feedback
---

Toute nouvelle page admin doit utiliser les composants partagés dans `src/app/admin/_components/ui/` :

```tsx
import { AdminPageHeader, AdminKPIGrid, AdminSection, AdminTableWrapper, AdminFilterBar } from "@/app/admin/_components/ui";
```

**Règles fondamentales :**
- Padding page racine : `p-4 md:p-6 lg:p-8`
- Titre H1 + bouton action → `<AdminPageHeader title="..." subtitle="..." action={...} />`
- Grille KPI → `<AdminKPIGrid cols={4}>` (2 cols mobile, 3 tablette, 4 desktop)
- Section card → `<AdminSection title="...">`
- Table → `<AdminTableWrapper><table>...</table></AdminTableWrapper>`
- Barre filtres → `<AdminFilterBar>` (inputs avec `w-full sm:w-44`)
- Grilles non-KPI → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-X`
- Touch targets sidebar → `min-h-[44px]`

**Why:** Jules a demandé un admin 100% responsive mobile-first le 2026-04-09. Les composants partagés garantissent la cohérence sur les ~43 pages existantes et toutes les futures pages.

**How to apply:** Chaque fois qu'une nouvelle page admin est créée ou modifiée, appliquer ces règles automatiquement sans attendre que Jules le demande.
