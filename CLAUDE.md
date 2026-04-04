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
| `admin/(protected)` | `/admin/*` | Clerk — hardcoded to `gavegliojules@gmail.com` |
| `studio` | `/studio` | Sanity built-in |

The `(club)` group has its own DM Mono font and `bg-cream text-earth` color scheme. Club access gating is done inside each page via Supabase, not in the layout.

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
- Key tables: `profiles`, `products`, `brands`, `vans_location`, `prospects`, `vba_competitors`, `vba_keywords`, `backlink_prospects`, `backlink_outreach`, `backlink_scrape_sessions`, `facebook_groups`, `facebook_outreach_schedule`, `road_trip_requests`, `cmo_reports`, `marketplace_leads`
- `profiles.plan = "club_member"` controls Club Privé access (Club is 100% free — no Stripe, no subscription)

**3. Clerk** — authentication
- Protected routes declared in `src/middleware.ts` (only `/dashboard` currently)
- Admin panel uses Clerk but adds an email allowlist check in `admin/(protected)/layout.tsx`
- `userId` from Clerk is stored as `clerk_id` FK in Supabase `profiles`

### Key component patterns

**FloatingCTA** (`src/components/layout/FloatingCTA.tsx`) — client component that reads `ArticleCategoryContext` (set by `ArticleCategorySync` on article pages) to show category-aware CTAs. Formation pages trigger a Calendly popup instead of a link.

**CalendlyButton** (`src/components/ui/CalendlyButton.tsx`) — thin wrapper around `CalendlyModal` (`src/components/ui/CalendlyModal.tsx`). `CalendlyModal` is a client component that lazy-loads Calendly assets on click and renders an inline widget inside a portal modal. No global Calendly script is required in `layout.tsx` — assets are injected dynamically on first open.

**Location city pages** (`src/app/(site)/location/[slug]/page.tsx`) — each page uses:
- `PracticalInfoSection` — shared component with image + info cards
- `VanSelectionSection` — async Server Component fetching vans from Sanity, renders `VanCard`
- `VanCard` — links to individual van pages (`/location/yoni`, `/location/xalbat`), not directly to Yescapa

**Article rendering** (`src/app/(site)/articles/[slug]/page.tsx`) — uses `@portabletext/react` with custom components. Two key preprocessing helpers handle content written by the blog agent:
- `renderInlineMarkdown()` — parses raw `[text](url)` link syntax inside text blocks
- `groupTableBlocks()` — groups consecutive pipe-delimited lines into virtual table blocks rendered as `<ArticleTable>`

### Shared helpers and utilities (refactoring)

Added during architecture refactoring — use these instead of duplicating logic:

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

- `blog-writer-agent.ts` — 3 articles SEO/semaine via Gemini → Sanity. **Markdown tables are forbidden in prompts** — use bullet lists instead.
- `backlinks-daily-outreach.ts` — Mar-Ven 9h30 Paris. 4 phases : reply detection (Gmail threads + Groq sentiment) → follow-up J+4 → 5 nouveaux outreach/jour (email discovery + Groq email + Gmail API) → label BACKLINKS + Telegram recap.
- `backlinks-weekly-agent.ts` — Lundi 8h. Découvre prospects via Tavily (rotation 4 méthodes), score Groq ≥5, insère dans `backlink_prospects`.
- `road-trip-publisher-agent.ts` — Toutes les 4h. Transforme les road trips générés en articles SEO Sanity.
- `cmo-weekly-agent.ts` / `cmo-monthly-agent.ts` — Rapports marketing hebdo/mensuel via Groq.
- `keyword-researcher.ts` — DataForSEO keyword research (manuel)
- `seo-checker.ts` — Audit SEO hebdomadaire

### Admin panel (`/admin`)

Sections: Dashboard, SEO Analytics, Mots-Clés, Performance (PSI), Blog, Vans, Marques, Produits, Spots, Media, Prospection, Road Trips, Backlinks, Agents, Marketing (CMO).

**Prospection** (`/admin/club/prospection`) — internal CRM for partner brand outreach. Separate `prospects` Supabase table (distinct from `brands`). Three AI-powered API routes using SSE streaming:
- `/api/admin/club/prospect/discover` — Tavily search + Groq analysis
- `/api/admin/club/prospect/enrich` — Jina AI site scraping + Groq contact extraction
- `/api/admin/club/prospect/generate-email` — Groq personalized email generation

**Backlinks SEO** (`/admin/backlinks`) — Kanban board for backlink prospect management. Columns: découvert → contacté → relancé → obtenu / rejeté. Features: AI-powered prospect discovery (SSE), email generation + sending via Gmail API, drag & drop status. Tables: `backlink_prospects`, `backlink_outreach`, `backlink_scrape_sessions`. Automated by `backlinks-daily-outreach.ts` (5 emails/day + follow-ups + reply detection) and `backlinks-weekly-agent.ts` (prospect discovery).

**Marketplace MVP-0** (`/proposer-votre-van`) — Landing page for van owner pre-registration. Simple form → Supabase `marketplace_leads` table. Goal: validate interest from 5 van owners before building the full marketplace.

**Road Trip Personnalisé** (`/road-trip-personnalise`) — AI-powered itinerary generator. Wizard collects region/duration/interests/profile → Tavily search + Groq (llama-3.3-70b) → Resend email. Stores requests in Supabase `road_trip_requests` table. Rate limited (3 req/IP/hour). Admin at `/admin/road-trips`.

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
```

## Design System

- **Glassmorphism**: use `.glass-card`, `.glass-card-hover`, `.badge-glass` CSS classes
- **Buttons**: `.btn-primary`, `.btn-ghost`, `.btn-gold` (formation/gold gradient), `.btn-shine`
- **Colors**: custom tokens `bg-bg-primary`, `text-text-primary`, `text-accent-blue` in `globals.css`
- **Gold gradient** (formation): `linear-gradient(135deg, #B9945F 0%, #E4D398 100%)`
- **Fonts**: Inter (main), Bebas Neue (display), DM Mono (Club Privé layout only)
- **Images**: `next/image` with `unoptimized: true`. Allowed hostnames in `next.config.mjs`. Use `imagePresets` from `src/lib/sanity/client.ts` for Sanity images.

## Deployment

Auto-deploy via Vercel on every push to `main`. No manual step needed.
