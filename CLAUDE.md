# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build (runs TypeScript + ESLint)
npm run lint      # ESLint only
```

Run scripts directly with tsx (no compilation step):
```bash
npx tsx scripts/agents/blog-writer-agent.ts          # next queued article
npx tsx scripts/agents/blog-writer-agent.ts [slug]   # specific article
npx tsx scripts/agents/keyword-researcher.ts
```

There is no `basePath` configured — all routes are served at `/` (not `/vanzon`). Sanity Studio is at `http://localhost:3000/studio`.

## Route Groups

Four distinct route groups, each with its own layout:

| Group | Path prefix | Auth |
|---|---|---|
| `(site)` | All public pages | None (dashboard needs Clerk) |
| `(club)` | `/club/*` | Supabase `profiles.plan = "club_member"` checked per page |
| `(tunnel)` | `/van-business-academy/*` | None (tunnel de vente VBA) |
| `admin/(protected)` | `/admin/*` | Clerk — hardcoded to `gavegliojules@gmail.com` |
| `studio` | `/studio` | Sanity built-in |

The `(club)` group has its own DM Mono font and `bg-cream text-earth` color scheme. Club access gating is done inside each page via Supabase, not in the layout. **Note : le Club a ete retire du menu nav principal (mai 2026) — les pages restent accessibles par URL directe pour le SEO.**

## Architecture

**Next.js 14 App Router** — all pages are Server Components by default. Client Components are used only for interactivity (carousels, forms, modals, FloatingCTA).

### Three data layers

**1. Sanity CMS** (`src/lib/sanity/`)
- Public read: `sanityFetch()` in `src/lib/sanity/client.ts` — returns `null` gracefully if unconfigured
- Admin write: `src/lib/sanity/adminClient.ts` — uses `SANITY_API_WRITE_TOKEN`, server-only
- Queries: `src/lib/sanity/queries.ts`
- Schemas: `sanity/schemas/`
- Sanity content: vans, testimonials, hero images, Pays Basque spots, blog articles

**2. Supabase** (`src/lib/supabase/server.ts`)
- `createSupabaseAdmin()` — service_role key, bypasses RLS, server-only
- `createSupabaseAnon()` — public read
- Key tables: `profiles`, `products`, `brands`, `vans_location`, `prospects`, `vba_competitors`, `vba_keywords`, `backlink_prospects`, `backlink_outreach`, `backlink_scrape_sessions`, `facebook_groups`, `facebook_outreach_schedule`, `road_trip_requests`, `cmo_reports`, `marketplace_leads`, `funnel_events`, `vba_modules`, `vba_lessons`, `vba_progress`
- `profiles.plan = "club_member"` controls Club Prive access (Club is 100% free — no Stripe, no subscription)
- `profiles.plan = "vba_member"` controls VBA access

**3. Clerk** — authentication
- Protected routes declared in `src/middleware.ts` (only `/dashboard` currently)
- Admin panel uses Clerk but adds an email allowlist check in `admin/(protected)/layout.tsx`
- `userId` from Clerk is stored as `clerk_id` FK in Supabase `profiles`

### Key component patterns

**FloatingCTA** (`src/components/layout/FloatingCTA.tsx`) — client component that reads `ArticleCategoryContext` (set by `ArticleCategorySync` on article pages) to show category-aware CTAs. Formation pages trigger a Calendly popup instead of a link.

**CalendlyButton** (`src/components/ui/CalendlyButton.tsx`) — thin wrapper around `CalendlyModal` (`src/components/ui/CalendlyModal.tsx`). `CalendlyModal` is a client component that lazy-loads Calendly assets on click and renders an inline widget inside a portal modal. No global Calendly script is required in `layout.tsx` — assets are injected dynamically on first open.

**Navbar** (`src/components/layout/Navbar.tsx`) — client component with dynamic logo per section (Location, Formation, Club). Menu mobile sans emojis. Le Club a ete retire du menu nav (mai 2026).

**Footer** (`src/components/layout/Footer.tsx`) — client component with dynamic logo (logo dore sur `/formation`, logo classique partout ailleurs). Meme logique que la Navbar.

**Location city pages** — template CTA-first (refonte mai 2026). Structure identique pour toutes les villes :
1. Hero compact (60vh) — breadcrumb, badge "5/5 sur Google" (statique, sans nombre d'avis), H1 SEO, 1 CTA vers #nos-vans
2. `VanSelectionSection` — vans en position 2 (immediatement visible) + `CamboMapSection` integree
3. Temoignage Google (1 avis client)
4. CTA Road Trip personnalise → `/road-trip-personnalise`
5. FAQ (schema FAQPage JSON-LD)
6. CTA final (2 boutons : Yescapa + Wikicampers)

Pages concernees : Biarritz, Hossegor, Bayonne, Saint-Jean-de-Luz, Week-end, Foret d'Irati.

**VanSelectionSection** (`src/components/location/VanSelectionSection.tsx`) — async Server Component fetching vans from Sanity. Includes trust bar (annulation flexible, assurance, depart Cambo) + `CamboMapSection`.

**CamboMapSection** (`src/components/location/CamboMapSection.tsx`) — Google Maps iframe Cambo-les-Bains, reutilisable. Props optionnels : `destination`, `distance`. Utilise sur les pages ville et les pages van individuelles.

**MarketplaceVansGrid** (`src/components/marketplace/MarketplaceVansGrid.tsx`) — affiche 4 vans max sur mobile avec bouton "Voir plus", tous les vans sur desktop.

**Article rendering** (`src/app/(site)/articles/[slug]/page.tsx`) — uses `@portabletext/react` with custom components. Two key preprocessing helpers handle content written by the blog agent:
- `renderInlineMarkdown()` — parses raw `[text](url)` link syntax inside text blocks
- `groupTableBlocks()` — groups consecutive pipe-delimited lines into virtual table blocks rendered as `<ArticleTable>`

### Google Places API (`src/lib/google-places.ts`)

`getGooglePlaceStats()` fetche le rating et nombre d'avis Google. **N'est plus utilise sur la homepage ni sur les pages ville** (remplace par "5/5 sur Google" statique, mai 2026). Reste utilise sur la page `/location` principale et certaines pages individuelles.

### Shared helpers and utilities

- `src/lib/auth.ts` — `requireAdmin()` helper for admin API routes (Clerk auth + email allowlist check)
- `src/lib/sse.ts` — `createSSEResponse()` helper for SSE streaming routes
- `src/lib/slugify.ts` — shared `slugify()` function (single canonical implementation)
- `src/lib/article-utils.tsx` — article preprocessing utilities (`renderInlineMarkdown`, `groupTableBlocks`)
- `src/types/article-queue.ts` — canonical `ArticleQueueItem` type
- `src/components/article/` — shared article components: `ArticleTable`, `PortableTextComponents`, `SectionCTA`

### Gmail API client (`src/lib/gmail/client.ts`)

Sends emails from `jules@vanzonexplorer.com` via Gmail API OAuth2. Automatically fetches and appends the Gmail signature. Supports:
- `sendViaGmail()` — send (or reply in thread with `threadId` + `inReplyTo`)
- `getGmailLabelId()` / `applyGmailLabel()` — label management
- `getThreadMessages()` — read all messages in a thread (reply detection)
- `getMessageHeader()` — fetch specific MIME headers

### Email discovery (`src/lib/email-discovery/index.ts`)

7-stage pipeline to find contact emails for a domain: Jina AI scraping (12 pages) → Hunter.io → Snov.io → regex extraction → ZeroBounce validation → Groq consolidation. Exports `discoverEmails(domainOrUrl, options)`.

### AI agent scripts (`scripts/agents/`)

22 agents registered in `scripts/agents/registry.json` (visible at `/admin/agents`). Key agents:

- `blog-writer-agent.ts` — 3 articles SEO/semaine via Gemini → Sanity. **Markdown tables are forbidden in prompts** — use bullet lists instead. **PAUSE depuis le 3 mai 2026** — attente indexation Google.
- `backlinks-daily-outreach.ts` — Mar-Ven 9h30 Paris. 4 phases : reply detection (Gmail threads + Groq sentiment) → follow-up J+4 → 5 nouveaux outreach/jour (email discovery + Groq email + Gmail API) → label BACKLINKS + Telegram recap.
- `backlinks-weekly-agent.ts` — Lundi 8h. Decouvre prospects via Tavily (rotation 4 methodes), score Groq >=5, insere dans `backlink_prospects`.
- `road-trip-publisher-agent.ts` — Toutes les 4h. Transforme les road trips generes en articles SEO Sanity.
- `cmo-weekly-agent.ts` / `cmo-monthly-agent.ts` — Rapports marketing hebdo/mensuel via Groq.
- `keyword-researcher.ts` — DataForSEO keyword research (manuel)
- `seo-checker.ts` — Audit SEO hebdomadaire

### Boss Agent (`agents/boss.md`)

Agent strategique IA — COO virtuel de Vanzon Explorer. Invoque via `/boss`. Lit les fichiers Core dans `Vanzon Memory Database/🔒 INTERNE/boss/` (Profile, Business, Goal, Diagnosis, Actions, Journal, Common_Problems) et collecte les donnees dynamiques (Supabase) avant chaque session. Flow : check-in → diagnostic → proposition → execution.

### Vanzon Memory Database

Source unique de verite pour le contexte metier : `Vanzon Memory Database/` a la racine du projet. Index complet : `Vanzon Memory Database/🏠 INDEX.md`. Contient le positionnement, l'identite de marque, les regles IA, la vision produit, le business model, et les fichiers Boss.

### Admin panel (`/admin`)

Sections: Dashboard, SEO Analytics, Mots-Cles, Performance (PSI), Blog, Vans, Marques, Produits, Spots, Media, Prospection, Road Trips, Backlinks, Agents, Marketing (CMO), VBA (Formation), Tunnel VBA (Funnel Analytics).

**Prospection** (`/admin/club/prospection`) — internal CRM for partner brand outreach. Separate `prospects` Supabase table (distinct from `brands`). Three AI-powered API routes using SSE streaming:
- `/api/admin/club/prospect/discover` — Tavily search + Groq analysis
- `/api/admin/club/prospect/enrich` — Jina AI site scraping + Groq contact extraction
- `/api/admin/club/prospect/generate-email` — Groq personalized email generation

**Backlinks SEO** (`/admin/backlinks`) — Kanban board for backlink prospect management. Columns: decouvert → contacte → relance → obtenu / rejete. Features: AI-powered prospect discovery (SSE), email generation + sending via Gmail API, drag & drop status. Tables: `backlink_prospects`, `backlink_outreach`, `backlink_scrape_sessions`. Automated by `backlinks-daily-outreach.ts` and `backlinks-weekly-agent.ts`.

**Marketplace MVP-0** (`/proprietaire`) — Landing page for van owner pre-registration. Simple form → Supabase `marketplace_leads` table.

**Road Trip Personnalise** (`/road-trip-personnalise`) — AI-powered itinerary generator. Wizard collects region/duration/interests/profile → Tavily search + Groq (llama-3.3-70b) → Resend email. Stores requests in Supabase `road_trip_requests` table. Rate limited (3 req/IP/hour). Admin at `/admin/road-trips`. Utilise comme CTA de capture email sur toutes les pages ville.

**Van Business Academy (VBA)** (`/dashboard/vba`) — Formation video integree au dashboard utilisateur. Videos hebergees sur Bunny.net Stream (embed iframe). Gating via `profiles.plan = "vba_member"`. Structure :
- Tables Supabase : `vba_modules`, `vba_lessons`, `vba_progress`
- Dashboard cote user : hub progression (`/dashboard/vba`), lecteur video (`/dashboard/vba/[moduleSlug]/[lessonSlug]`)
- Admin : `/admin/vba` (modules CRUD + reordonnement), `/admin/vba/[moduleId]` (lecons CRUD + ressources)
- API routes : `/api/admin/vba/modules`, `/api/admin/vba/lessons`
- Server Actions pour marquage completion : `src/app/(site)/dashboard/vba/_actions.ts`
- 10 modules, ~60 videos, 73 transcrits complets
- Prix actuel : 997 EUR (tarif lancement) → 1 497 EUR apres 10 ventes
- Tunnel : Meta Ads (600 EUR/mois) → opt-in email → VSL 12min → call Calendly → closing → paiement Stripe

**Tunnel VBA (Funnel Analytics)** (`/admin/funnel`) — Dashboard tracking 100% fiable cote serveur. Structure :
- Table Supabase : `funnel_events` (session_id, email, event, page, UTMs, metadata)
- Tracking dual : Meta Pixel (client `trackEvent()`) + Supabase (serveur via `/api/funnel/track`)
- Helper : `src/lib/funnel-tracking.ts` — `trackFunnel(event, page, options)` fire les deux en parallele
- Events trackes : optin, vsl_view, vsl_25/50/75/100, booking_start, booking_confirmed, checkout, purchase
- Tunnel pages : `(tunnel)/van-business-academy/` — inscription → presentation → diagnostic-offert → appel-confirme → paiement → paiement-confirme
- Admin dashboard : KPIs, funnel visuel, attribution UTM, evenements recents

## Strategie Location — Modele assurance et tunnel

Le site vanzonexplorer.com est une **couche d'acquisition SEO**. L'assurance tous risques est fournie PAR les plateformes (Yescapa, Wikicampers) — Vanzon ne peut pas proposer de reservation directe sans elles. Les pages villes sont des etapes intermediaires dans le tunnel : trafic SEO/blog → pages ville → CTA vers plateforme (Yescapa/Wikicampers). Le site redirige vers les plateformes qui gerent assurance + paiement. A mesure que la flotte grandit, chaque van sera affiche avec son propre lien de reservation plateforme.

## VSL Acquisition Strategy (articles Business Van)

Tous les articles avec `category === "Business Van"` integrent automatiquement un systeme d'acquisition VSL a 3 couches pointant vers `/van-business-academy/presentation`.

**Detection** : basee sur le champ Sanity `category`. Pas de champ `articleIntent` separe.

**Composants** (conditionnels dans `articles/[slug]/page.tsx`) :
- `VSLHeroBanner` (`src/components/marketing/VSLHeroBanner.tsx`) — above-the-fold, avant le contenu
- `VSLCalloutBlock` (`src/components/marketing/VSLCalloutBlock.tsx`) — fin d'article, remplace RoadTripCTA
- `VSLStickyBar` (`src/components/marketing/VSLStickyBar.tsx`) — barre mobile apres 40% scroll, fermable

**URL centralisee** : `src/lib/constants/vsl.ts` — ne JAMAIS hardcoder l'URL VSL ailleurs. Utiliser `buildVslUrl(layer, slug)` pour les UTM.

**FloatingCTA** : desactive sur articles "Business Van" (la VSLStickyBar prend le relais).

**Blog-writer-agent** : si `category === "Business Van"`, le prompt Gemini injecte 2-3 liens inline naturels vers la VSL dans le corps de l'article. Logging en console.

**Regle absolue** : ces composants ne doivent JAMAIS apparaitre sur des articles travel/destinations/spots — uniquement sur Business Van.

## Homepage (mai 2026)

Structure actuelle apres refonte :
1. Hero (badge "5/5 sur Google", H1, 2 CTAs)
2. MarketplaceVansSection (vans avec "voir plus" mobile)
3. Destinations (4 cards : Biarritz, Hossegor, Bayonne, Saint-Jean-de-Luz — Week-end et Irati masques)
4. Avis clients (3 temoignages Google)
5. Van Business Academy (2 stats : A→Z + 100%, "nous vous accompagnons", 1 CTA dore)
6. CTA saisonnier
7. RoadTripCTA

Sections supprimees : ProprietaireCTA, section Pays Basque, OtherServices ("On ne s'arrete pas la").

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=lewexa74
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_API_WRITE_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://vanzonexplorer.com
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# Blog agent
GEMINI_API_KEY=
PEXELS_API_KEY=
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
# Prospection + Road Trip AI
GROQ_API_KEY=
GROQ_API_KEY_2=
GROQ_API_KEY_3=
JINA_API_KEY=
TAVILY_API_KEY=
# Email (road trip generator)
RESEND_API_KEY=
# Telegram notifications (road trip generator)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
# Admin SEO/analytics
GOOGLE_PSI_API_KEY=
GOOGLE_GSC_CLIENT_ID=
GOOGLE_GSC_CLIENT_SECRET=
GOOGLE_GSC_REFRESH_TOKEN=
# Gmail API (outreach backlinks)
GOOGLE_GMAIL_REFRESH_TOKEN=
# Email discovery (backlinks)
HUNTER_API_KEY=
ZEROBOUNCE_API_KEY=
# Pinterest automation
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_ACCESS_TOKEN=
# VBA — Bunny.net video hosting
NEXT_PUBLIC_BUNNY_LIBRARY_ID=   # Library ID Bunny.net Stream (VBA videos)
BUNNY_API_KEY=                  # API key pour library VBA
# Google Places (avis)
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
```

## Design System

- **Glassmorphism**: use `.glass-card`, `.glass-card-hover`, `.badge-glass` CSS classes
- **Buttons**: `.btn-primary`, `.btn-ghost`, `.btn-gold` (formation/gold gradient), `.btn-shine`
- **LiquidButton**: composant avance avec variantes (blue, gold, purple, slate, rose, ghost, orange, green), tailles (sm, md, lg, responsive), effets shine/glow
- **Colors**: custom tokens `bg-bg-primary`, `text-text-primary`, `text-accent-blue` in `globals.css`
- **Gold gradient** (formation): `linear-gradient(135deg, #B9945F 0%, #E4D398 100%)`
- **Fonts**: Inter (main), Bebas Neue (display), DM Mono (Club Prive layout only)
- **Images**: `next/image` with `unoptimized: true`. Allowed hostnames in `next.config.mjs`. Use `imagePresets` from `src/lib/sanity/client.ts` for Sanity images.
- **Google avis** : toujours afficher "5/5 sur Google" sans nombre d'avis (decision mai 2026)

## Deployment

Auto-deploy via Vercel on every push to `main`. No manual step needed.
