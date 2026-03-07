# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

The app is served under `/vanzon` basePath (configured in `next.config.mjs`).

Sanity Studio is accessible at `http://localhost:3000/vanzon/studio`.

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
NEXT_PUBLIC_SITE_URL=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

## Architecture

**Next.js 14 App Router** with two distinct route groups:
- `src/app/(site)/` — public-facing pages (homepage, location, formation, achat, pays-basque, club, a-propos)
- `src/app/studio/` — embedded Sanity Studio

**Three data layers:**

1. **Sanity CMS** (`src/lib/sanity/`) — content for vans, testimonials, hero images, Pays Basque spots. Use `sanityFetch()` from `src/lib/sanity/client.ts` — it gracefully returns `null` if Sanity isn't configured. Queries are in `src/lib/sanity/queries.ts`. Schemas are in `sanity/schemas/`.

2. **Supabase** (`src/lib/supabase/server.ts`) — user profiles, saved products, `vans_location` table. Two clients: `createSupabaseAdmin()` (service_role, server-only, bypasses RLS) and `createSupabaseAnon()` (public read). The dashboard page upserts user profiles on every visit using Clerk's userId as the FK.

3. **Clerk** — authentication. Protected routes are declared in `src/middleware.ts`. Currently only `/dashboard` requires auth. Sign-in/sign-up use Clerk's hosted components at `/sign-in` and `/sign-up`.

**Authentication flow:** Clerk handles auth → `userId` from `auth()` is used as `clerk_id` in Supabase `profiles` table → profile is upserted on dashboard load.

**Component organization:**
- `src/components/formation/` — Formation Van Business Academy page components
- `src/components/van/` — Van listing/detail components
- `src/components/ui/` — Shared UI primitives (GlassCard, LiquidButton, Badge, HeroCarousel, ResponsiveImage)
- `src/components/layout/` — Navbar, Footer, FloatingCTA

**Design system:** Glassmorphism aesthetic, Tailwind CSS, Framer Motion animations. Custom Tailwind tokens (`bg-bg-primary`, `text-text-primary`) defined in globals.css. Inter font via `next/font/google`.

**Images:** `next/image` with `unoptimized: true`. Allowed remote patterns: `cdn.sanity.io`, `iili.io`, `freeimage.host`. Use `imagePresets` from `src/lib/sanity/client.ts` for Sanity images (vanCard, hero, thumb, gallery, portrait).

## Data Model Notes

- Sanity schemas: `van`, `testimonial`, `spotPaysBasque`, `mediaAsset`, `heroImages`
- Supabase tables used: `profiles`, `saved_products`, `products`, `brands`, `vans_location`
- `profiles.plan` field controls access level — `"club_member"` unlocks Club Privé features
