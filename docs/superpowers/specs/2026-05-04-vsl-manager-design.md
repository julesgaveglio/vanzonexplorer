# Spec — VSL Manager (admin + player dynamique)

**Date :** 2026-05-04
**Objectif :** Gerer plusieurs versions de VSL, activer/desactiver en un clic, comparer les courbes de retention superposees par version.

## Contexte

La VSL actuelle est hardcodee dans `VSLClient.tsx` (URL Bunny en dur). Avec 75 vues et des donnees de retention, Jules veut pouvoir iterer sur sa VSL : publier une V2, comparer les performances avec la V1, et switcher dynamiquement la VSL active dans le tunnel de vente.

## Architecture

### 1. Table Supabase `vsl_versions`

```sql
CREATE TABLE vsl_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bunny_video_id TEXT NOT NULL,
  bunny_library_id TEXT NOT NULL DEFAULT '641831',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed la VSL actuelle comme V1
INSERT INTO vsl_versions (name, bunny_video_id, color, is_active, activated_at)
VALUES ('VSL1 — Version originale', '7739a3f1-ad32-4839-ba56-e4dc60a27a47', '#8B5CF6', true, now());
```

**Contrainte logique** : une seule VSL peut etre `is_active = true` a la fois. Geree cote API (pas de contrainte SQL unique car on a besoin de toutes a false temporairement).

### 2. API Routes

#### `GET /api/vsl/active`
- Public (pas d'auth — le tunnel en a besoin)
- Retourne la VSL active : `{ id, bunny_video_id, bunny_library_id, name }`
- Cache : `revalidate: 60` (1 min — suffisant, les switches sont rares)
- Fallback hardcode si aucune VSL active (securite)

#### `GET /api/admin/funnel/vsl`
- Auth admin requise
- Retourne toutes les VSL versions + stats agregees par version :
  - Pour chaque version : total vues, taux 25/50/75/100%, taux booking
  - Courbe de retention : requete `funnel_events` WHERE `event = 'vsl_exit'` AND `metadata->>'vsl_version_id' = X`, groupee par bucket 10 secondes
- Parametres : `?days=30` (periode)

#### `POST /api/admin/funnel/vsl`
- Auth admin
- Body : `{ name, bunny_video_id, bunny_library_id?, color, notes? }`
- Cree une nouvelle VSL version (is_active = false)

#### `PATCH /api/admin/funnel/vsl/[id]/activate`
- Auth admin
- Desactive la VSL courante (`is_active = false, deactivated_at = now()`)
- Active la VSL ciblee (`is_active = true, activated_at = now()`)
- Retourne la nouvelle VSL active

#### `DELETE /api/admin/funnel/vsl/[id]`
- Auth admin
- Interdit de supprimer la VSL active
- Supprime une VSL inactive

### 3. VSLClient dynamique

**Fichier modifie :** `src/app/(tunnel)/van-business-academy/presentation/page.tsx`

La page server-side fetch `/api/vsl/active` et passe les props au client :
```tsx
// page.tsx (server)
const vsl = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/vsl/active`).then(r => r.json());
return <VSLClient videoId={vsl.bunny_video_id} libraryId={vsl.bunny_library_id} vslVersionId={vsl.id} />;
```

**Fichier modifie :** `VSLClient.tsx`
- Remplacer les constantes hardcodees par les props
- Construire l'URL HLS : `https://vz-bac05373-d10.b-cdn.net/${videoId}/playlist.m3u8`
- Poster : `https://vz-bac05373-d10.b-cdn.net/${videoId}/thumbnail.jpg`
- Ajouter `vsl_version_id` dans les metadata de chaque event tracke

### 4. Enrichissement tracking

Dans `VSLClient.tsx`, chaque appel `trackFunnel()` pour les events VSL inclut :
```tsx
trackFunnel("vsl_view", "presentation", {
  metadata: { vsl_version_id: vslVersionId }
});
```

Events concernes : `vsl_view`, `vsl_25`, `vsl_50`, `vsl_75`, `vsl_100`, `vsl_exit`.

Cela permet de filtrer les courbes de retention par version dans l'admin.

### 5. UI Admin — Onglet "VSL" dans /admin/funnel

**Nouveau composant :** `VSLManagerClient.tsx` dans `/src/app/admin/(protected)/funnel/_components/`

**Integration :** ajouter un 4e onglet "VSL" dans `FunnelTabsClient.tsx` (apres Tunnel, Campagnes, Leads).

**Layout de l'onglet :**

#### Section haute — Liste des VSL versions
- Cards ou lignes de tableau pour chaque VSL
- Chaque ligne : pastille couleur, nom, statut (badge vert "Active" ou gris "Inactive"), date d'activation, bouton "Activer" (avec confirmation modale)
- Bouton "+ Ajouter une VSL" → formulaire inline ou modale :
  - Nom (text)
  - Bunny Video ID (text, obligatoire)
  - Couleur (color picker ou presets : violet, bleu, jaune, vert, rouge)
  - Notes (textarea, optionnel)

#### Section basse — Courbes de retention superposees
- **Graphique Recharts (LineChart)** — meme lib que le funnel dashboard existant
- Axe X : secondes (0 → duree max de la plus longue VSL)
- Axe Y : % de viewers restants (100% → 0%)
- Une courbe par VSL version, dans sa couleur assignee
- Legende avec nom + couleur + nombre total de vues
- **Donnees** : construites depuis les `vsl_exit` events (metadata.exit_time_seconds) groupes par buckets de 10 secondes. Fallback sur vsl_25/50/75/100 si pas assez de `vsl_exit` data.
- Selecteur de periode (7j / 14j / 30j / 90j)

#### Section KPIs par version
- Tableau comparatif :
  | VSL | Vues | 25% | 50% | 75% | 100% | Booking | Conv. |
  - Chaque ligne coloree selon la couleur de la VSL

### 6. Fichiers a creer / modifier

| Action | Fichier |
|--------|---------|
| Creer | `supabase/migrations/XXXX_vsl_versions.sql` |
| Creer | `src/app/api/vsl/active/route.ts` |
| Creer | `src/app/api/admin/funnel/vsl/route.ts` |
| Creer | `src/app/api/admin/funnel/vsl/[id]/activate/route.ts` |
| Creer | `src/app/admin/(protected)/funnel/_components/VSLManagerClient.tsx` |
| Modifier | `src/app/admin/(protected)/funnel/_components/FunnelTabsClient.tsx` (ajouter onglet VSL) |
| Modifier | `src/app/(tunnel)/van-business-academy/presentation/page.tsx` (fetch dynamique) |
| Modifier | `src/app/(tunnel)/van-business-academy/presentation/VSLClient.tsx` (props au lieu de hardcode) |

### 7. Migration des donnees existantes

Le seed SQL insere la VSL actuelle comme "VSL1" avec `is_active = true`. Les 75 vues existantes dans `funnel_events` n'ont pas de `vsl_version_id` dans leurs metadata — la courbe les affichera sous "VSL1 (historique)" par defaut quand le `vsl_version_id` est absent.

### 8. Securite et fallback

- Si aucune VSL active en base → fallback sur l'ID hardcode actuel (securite zero-downtime)
- L'API `/api/vsl/active` est publique mais ne retourne que l'ID video et le nom (pas de donnees sensibles)
- Suppression d'une VSL active interdite cote API
