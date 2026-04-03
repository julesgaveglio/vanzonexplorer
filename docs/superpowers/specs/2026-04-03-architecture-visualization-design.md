# Architecture Visualization — Design Spec

**Date:** 2026-04-03
**Status:** Approved

## Objectif

Ajouter une page `/admin/architecture` dans le dashboard admin qui affiche un graphe interactif de toute l'architecture du code Vanzon : agents, routes API, libs internes et services externes — avec leurs connexions, leur statut opérationnel et un badge visuel sur les fichiers récemment modifiés.

## Contexte

Le projet Vanzon contient ~22 agents scripts, ~85 routes API, ~8 libs internes et ~10 services externes (Groq, Sanity, Supabase, Gemini, etc.) interconnectés. Sans vue globale, il est difficile d'identifier les dépendances, les couplages excessifs ou l'impact d'un changement. Cette page doit devenir la carte mentale vivante du système.

---

## Architecture

### 1. API Route — `/api/admin/architecture`

**Fichier :** `src/app/api/admin/architecture/route.ts`

Analyse statique du codebase à chaque appel. Retourne `{ nodes, edges, scannedAt }`.

**Sources de données :**

| Source | Ce qu'on extrait |
|---|---|
| `scripts/agents/registry.json` | Nœuds agents (name, emoji, trigger, schedule, apis, file, pipeline) |
| `src/app/api/**/route.ts` | Nœuds routes API (path, méthodes HTTP, section déduite du chemin) |
| `src/lib/**/*.ts` | Nœuds libs internes (name, chemin) |
| Champ `apis` du registry | Nœuds services externes (Groq, Sanity, Gemini, Pexels, Supabase…) |
| `fs.stat` sur chaque fichier | `mtime` pour détecter les modifications récentes |

**Construction des arêtes :**

- `agent → service_externe` : depuis le champ `apis` du registry
- `agent → route_api` : patterns connus (ex: `road-trip-publisher` → `road-trip/generate`)
- `route_api → lib` : regex sur les imports du fichier (`import.*from.*src/lib/`)
- `lib → service_externe` : regex sur les imports du fichier

**Format de réponse :**

```ts
type Node = {
  id: string
  type: 'agent' | 'api_route' | 'lib' | 'external_service'
  label: string
  emoji?: string
  meta: {
    // agents
    trigger?: 'cron' | 'webhook' | 'manual'
    schedule?: string
    cronExpression?: string
    apis?: string[]
    file?: string
    manualCommand?: string
    pipeline?: string
    // api_routes
    methods?: string[]
    section?: string
    authRequired?: boolean
    // all
    mtime?: number
  }
}

type Edge = {
  source: string
  target: string
  type: 'calls' | 'imports' | 'consumes'
}

type ArchitectureResponse = {
  nodes: Node[]
  edges: Edge[]
  scannedAt: number
}
```

---

### 2. Page — `/admin/architecture`

**Fichiers :**
- `src/app/admin/(protected)/architecture/page.tsx` — Server Component minimal, rend `ArchitectureClient`
- `src/app/admin/(protected)/architecture/ArchitectureClient.tsx` — Client Component principal
- `src/app/admin/(protected)/architecture/_components/NodeDetailPanel.tsx` — Panneau de détail

#### ArchitectureClient

- Fetch `/api/admin/architecture` au mount
- Détection des nœuds modifiés : compare `node.meta.mtime` avec `localStorage['arch_last_visit']` (timestamp ISO stocké à chaque visite)
- Rend le graphe avec **React Flow** (`@xyflow/react`)
- Layout automatique avec **dagre** (`dagre` ou `@dagrejs/dagre`)
- Barre de filtres en haut : chips toggle par type (Agents / Routes API / Libs / Services ext.) + champ de recherche textuelle
- Filtre les nœuds et arêtes selon les chips actifs
- Clic sur un nœud → ouvre `NodeDetailPanel` (panneau droit fixe, width 300px)
- Bouton "Re-scanner" → re-fetch l'API

#### Types de nœuds et couleurs

| Type | Couleur bordure | Background |
|---|---|---|
| `agent` | `#f59e0b` | `#1c1700` |
| `api_route` | `#60a5fa` | `#001226` |
| `lib` | `#a78bfa` | `#120026` |
| `external_service` | `#34d399` | `#001a10` |

Badge orange `#f97316` (point 10px) en haut à droite du nœud si `mtime > lastVisit`.

#### NodeDetailPanel

Contenu selon le type du nœud sélectionné :

**Agent :**
- Statut (actif/inactif + "Dernière exécution")
- Schedule + badge "Modifié récemment" si applicable
- APIs consommées (tags)
- Trigger (tags)
- Commande manuelle (bloc monospace copiable)
- Lien fichier source (bouton)
- Pipeline (texte)

**Route API :**
- Méthode HTTP (GET/POST)
- Section (déduite du chemin)
- Auth requise (oui/non)
- Libs internes utilisées

**Lib interne :**
- Chemin du fichier
- Consommée par (liste des agents/routes qui l'importent)

**Service externe :**
- Consommé par (liste des agents/routes)

---

### 3. Dépendances à ajouter

```
@xyflow/react       # graphe interactif
@dagrejs/dagre      # layout automatique
```

---

## UX / Design

- Fond : `#0f1117` avec grille de points (CSS `radial-gradient`)
- Topbar : nombre de nœuds + connexions, date de scan, bouton Re-scanner
- Filterbar : chips colorées par type + champ de recherche
- Légende en bas à gauche du canvas (overlay flottant)
- Panel de détail à droite (300px fixe), se ferme en recliquant le nœud ou via ✕
- Intégration dans la sidebar admin existante (entrée "Architecture" à ajouter)

---

## Ce qui est hors scope

- Analyse AST TypeScript (ts-morph) — trop lente, pas nécessaire
- Historique des changements (git diff)
- Monitoring en temps réel des exécutions d'agents (hors scope de cette feature)
- Vue timeline des crons
