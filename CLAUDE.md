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
- Key tables: `profiles`, `products`, `brands`, `vans_location`, `prospects`, `vba_competitors`, `vba_keywords`
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

### AI agent scripts (`scripts/agents/`)

- `blog-writer-agent.ts` — reads `scripts/data/article-queue.json`, generates SEO articles using Gemini, fetches Pexels cover images via DataForSEO SERP, publishes to Sanity. **Markdown tables are forbidden in prompts** — use bullet lists instead.
- `keyword-researcher.ts` — DataForSEO keyword research
- `seo-checker.ts` — SEO analysis

### Admin panel (`/admin`)

Sections: Dashboard, SEO Analytics, Mots-Clés, Performance (PSI), Blog, Vans, Marques, Produits, Spots, Media, Prospection, Road Trips.

**Prospection** (`/admin/club/prospection`) — internal CRM for partner brand outreach. Separate `prospects` Supabase table (distinct from `brands`). Three AI-powered API routes using SSE streaming:
- `/api/admin/club/prospect/discover` — Tavily search + Groq analysis
- `/api/admin/club/prospect/enrich` — Jina AI site scraping + Groq contact extraction
- `/api/admin/club/prospect/generate-email` — Groq personalized email generation

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
