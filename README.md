# Vanzon Explorer

Monorepo de **Vanzon Explorer** — location de vans aménagés au Pays Basque, revente de vans, et formation Van Business Academy (VBA).

🌐 Production : [vanzonexplorer.com](https://vanzonexplorer.com) — auto-déployé par Vercel à chaque push sur `main`.

## Les 3 piliers du business

1. **Location** — 2 vans (Yoni, Xalbat) au départ de Cambo-les-Bains, réservation via Yescapa/Wikicampers. Le site est la couche d'acquisition SEO.
2. **Revente** — les vans sont revendus après 1-2 ans de location (`/achat`).
3. **Formation** — Van Business Academy (`/van-business-academy`) : apprendre à aménager un van et en faire un business.

## Contenu du repo

| Dossier | Rôle |
|---|---|
| `src/` | Site Next.js 14 (App Router) — pages publiques, tunnel VBA, dashboards `/ads` et `/sigma`, admin, ~170 routes API |
| `scripts/agents/` | Agents IA autonomes (blog SEO, backlinks, CMO, road trips…) lancés par GitHub Actions |
| `scripts/archive/` | Scripts one-shot historiques (non référencés) |
| `agents/` | Prompts des agents pilotés depuis Claude Code (/boss, /cmo…) |
| `Vanzon Memory Database/` | Base de connaissance métier (source de vérité business) |
| `sanity/` | Schémas du CMS Sanity (studio sur `/studio`) |
| `supabase/` | Config Supabase |

## Documentation

- **`CLAUDE.md`** — instructions techniques (architecture, règles SEO critiques, sécurité, conventions)
- **`DEBRIEF-PROJET.md`** — carte d'orientation complète du dossier
- **`Vanzon Memory Database/🏠 INDEX.md`** — index de la base métier

## Démarrage

```bash
npm install
cp .env.example .env.local   # ou récupérer les vraies valeurs : npx vercel env pull .env.local
npm run dev                  # http://localhost:3000
npm run build                # build de prod (TypeScript + ESLint)
```

Stack : Next.js 14, TypeScript, Tailwind, Sanity (contenu), Supabase (données), Clerk (auth), Vercel (hosting + crons).
