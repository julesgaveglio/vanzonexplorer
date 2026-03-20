# Road Trip Personnalisé — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personalized road trip generator page that captures emails and sends AI-generated day-by-day itineraries via Resend, powered by Tavily (web search) and Groq (LLM).

**Architecture:** Public 4-step wizard → POST `/api/road-trip/generate` → Supabase save → Tavily search → Groq generation → Resend email. Admin dashboard at `/admin/road-trips` lists all requests with filters and stats.

**Tech Stack:** Next.js 14 App Router, react-hook-form + Zod, Framer Motion, Supabase, Groq SDK, Tavily REST API, Resend SDK (new), Tailwind glassmorphism design system.

**Spec:** `docs/superpowers/specs/2026-03-20-road-trip-personnalise-design.md`

**Note on testing:** No test framework exists in this project. Verification steps use `npx tsc --noEmit` (TypeScript check) and `npm run build` (full build). Manual browser verification is noted per task.

---

## Chunk 1: Foundation — Dependencies, DB, Constants

### Task 1: Install Resend

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install resend**

```bash
npm install resend
```

Expected: `package.json` now contains `"resend": "..."` in dependencies.

- [ ] **Step 2: Verify install**

```bash
node -e "const p = require('./package.json'); console.log('resend' in p.dependencies ? 'resend OK' : 'NOT FOUND')"
```

Expected: `resend OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(road-trip): install resend SDK"
```

---

### Task 2: Supabase migration — road_trip_requests

**Files:**
- Create: `supabase/migrations/20260320000001_road_trip_requests.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260320000001_road_trip_requests.sql

CREATE TABLE IF NOT EXISTS road_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  region TEXT NOT NULL,
  duree INTEGER NOT NULL CHECK (duree BETWEEN 1 AND 14),
  interets TEXT[] NOT NULL,
  style_voyage TEXT NOT NULL,
  periode TEXT NOT NULL,
  profil_voyageur TEXT NOT NULL,
  budget TEXT NOT NULL,
  experience_van BOOLEAN NOT NULL DEFAULT false,
  itineraire_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE road_trip_requests ENABLE ROW LEVEL SECURITY;

-- No public read policy — admin only via service_role
CREATE INDEX idx_road_trip_requests_email ON road_trip_requests(email);
CREATE INDEX idx_road_trip_requests_status ON road_trip_requests(status);
CREATE INDEX idx_road_trip_requests_created_at ON road_trip_requests(created_at DESC);
CREATE INDEX idx_road_trip_requests_email_status ON road_trip_requests(email, status, created_at DESC);
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration file content.
Expected: `CREATE TABLE` success, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260320000001_road_trip_requests.sql
git commit -m "feat(road-trip): add road_trip_requests table migration"
```

---

### Task 3: Supabase migration — email_unsubscribes

**Files:**
- Create: `supabase/migrations/20260320000002_email_unsubscribes.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260320000002_email_unsubscribes.sql

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);
```

- [ ] **Step 2: Run migration in Supabase dashboard**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260320000002_email_unsubscribes.sql
git commit -m "feat(road-trip): add email_unsubscribes table migration"
```

---

### Task 4: Shared constants

**Files:**
- Create: `src/lib/road-trip/constants.ts`

- [ ] **Step 1: Create constants file**

```typescript
// src/lib/road-trip/constants.ts

export const INTERETS_OPTIONS = [
  { value: 'nature_rando', label: 'Nature & randonnée' },
  { value: 'plages_surf', label: 'Plages & surf' },
  { value: 'culture_patrimoine', label: 'Culture & patrimoine' },
  { value: 'gastronomie', label: 'Gastronomie locale' },
  { value: 'sports_aventure', label: 'Sports & aventure' },
  { value: 'bienetre_detente', label: 'Bien-être & détente' },
  { value: 'vie_nocturne', label: 'Vie nocturne & festivals' },
] as const

export type InteretValue = typeof INTERETS_OPTIONS[number]['value']

export const MOIS_OPTIONS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
] as const

export type MoisValue = typeof MOIS_OPTIONS[number]

export const STYLE_VOYAGE_OPTIONS = [
  { value: 'lent', label: 'Rythme lent', desc: '2-3 stops max, profondeur' },
  { value: 'explorer', label: 'Explorer', desc: 'Maximum de spots' },
  { value: 'aventure', label: 'Aventure', desc: 'Off-road & nature sauvage' },
] as const

export const PROFIL_VOYAGEUR_OPTIONS = [
  { value: 'solo', label: 'Solo', emoji: '🧍' },
  { value: 'couple', label: 'En couple', emoji: '💑' },
  { value: 'famille', label: 'Famille', emoji: '👨‍👩‍👧' },
  { value: 'amis', label: 'Entre amis', emoji: '👥' },
] as const

export const BUDGET_OPTIONS = [
  { value: 'economique', label: 'Économique', desc: 'Camping gratuit & bivouac' },
  { value: 'confort', label: 'Confort', desc: 'Aires équipées & campings' },
  { value: 'premium', label: 'Premium', desc: 'Spots premium & glamping' },
] as const

export const DUREE_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 1)
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors related to `src/lib/road-trip/constants.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/road-trip/constants.ts
git commit -m "feat(road-trip): add shared constants (interests, months, styles)"
```

---

### Task 5: Add RESEND_API_KEY to env

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add env var**

Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Get the API key from https://resend.com/api-keys (create account, verify domain `vanzonexplorer.com`).

- [ ] **Step 2: Add to Vercel**

In Vercel Dashboard → Settings → Environment Variables → add `RESEND_API_KEY` for Production/Preview/Development.

- [ ] **Step 3: Commit reminder**

`.env.local` is git-ignored — do NOT commit it. The key lives only in `.env.local` locally and Vercel env vars in production.

---

## Chunk 2: API Route + Email Template

### Task 6: Email template (Resend React)

**Files:**
- Create: `src/emails/road-trip.tsx`

- [ ] **Step 1: Create email template**

```tsx
// src/emails/road-trip.tsx
// Plain HTML email — no @react-email/components dependency needed for v1
// Resend accepts raw HTML strings, so we export a function, not a JSX component

interface JourItineraire {
  numero: number
  titre: string
  spots: Array<{ nom: string; description: string; type: string }>
  camping: string
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

interface RoadTripEmailProps {
  prenom: string
  region: string
  duree: number
  itineraire: ItineraireData
  emailEncoded: string
}

export function buildRoadTripEmail({
  prenom,
  region,
  duree,
  itineraire,
  emailEncoded,
}: RoadTripEmailProps): { subject: string; html: string } {
  const subject = `🚐 Ton road trip ${duree}j en ${region} est prêt, ${prenom} !`

  const joursHtml = itineraire.jours
    .map(
      (jour) => `
      <div style="margin-bottom:32px;padding:24px;background:#1e293b;border-radius:12px;border-left:3px solid #3b82f6;">
        <h3 style="margin:0 0 8px 0;color:#93c5fd;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Jour ${jour.numero}</h3>
        <h2 style="margin:0 0 16px 0;color:#f1f5f9;font-size:20px;font-weight:700;">${jour.titre}</h2>
        ${jour.spots
          .map(
            (spot) => `
          <div style="margin-bottom:12px;padding:12px;background:#0f172a;border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${spot.type}</span>
            </div>
            <p style="margin:0 0 4px 0;color:#e2e8f0;font-weight:600;font-size:15px;">📍 ${spot.nom}</p>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">${spot.description}</p>
          </div>
        `
          )
          .join('')}
        <div style="margin-top:12px;padding:10px 14px;background:#0f172a;border-radius:8px;border-left:2px solid #22c55e;">
          <p style="margin:0;color:#86efac;font-size:13px;">🏕️ <strong>Camping :</strong> ${jour.camping}</p>
        </div>
        ${jour.tips ? `<p style="margin:12px 0 0 0;color:#64748b;font-size:13px;font-style:italic;">💡 ${jour.tips}</p>` : ''}
      </div>
    `
    )
    .join('')

  const conseilsHtml = itineraire.conseils_pratiques
    .map((c) => `<li style="margin-bottom:8px;color:#94a3b8;font-size:14px;line-height:1.6;">${c}</li>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0 24px;">
      <img src="https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png"
           alt="Vanzon Explorer" width="180" style="height:auto;display:inline-block;" />
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:16px;padding:32px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px 0;color:#93c5fd;font-size:14px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600;">Ton itinéraire personnalisé</p>
      <h1 style="margin:0 0 12px 0;color:#f1f5f9;font-size:28px;font-weight:800;line-height:1.2;">
        Road trip ${duree}j en ${region}
      </h1>
      <p style="margin:0;color:#94a3b8;font-size:16px;">Salut ${prenom} ! Voici ton itinéraire sur mesure 🚐</p>
    </div>

    <!-- Intro -->
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">${itineraire.intro}</p>
    </div>

    <!-- Jours -->
    ${joursHtml}

    <!-- Conseils pratiques -->
    <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:32px;">
      <h3 style="margin:0 0 16px 0;color:#f1f5f9;font-size:17px;font-weight:700;">💡 Conseils pratiques van</h3>
      <ul style="margin:0;padding-left:20px;">
        ${conseilsHtml}
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://vanzonexplorer.com/location"
         style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#3b82f6,#0ea5e9);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        🚐 Louer un van Vanzon Explorer
      </a>
      <p style="margin:12px 0 0 0;color:#475569;font-size:13px;">Disponible au départ de Cambo-les-Bains (Pays Basque)</p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e293b;padding-top:20px;text-align:center;">
      <p style="margin:0 0 8px 0;color:#475569;font-size:12px;">Vanzon Explorer — vanzonexplorer.com</p>
      <p style="margin:0;color:#334155;font-size:11px;">
        <a href="https://vanzonexplorer.com/unsubscribe?email=${emailEncoded}"
           style="color:#475569;text-decoration:underline;">Se désabonner</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()

  return { subject, html }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/emails/road-trip.tsx
git commit -m "feat(road-trip): add branded HTML email template"
```

---

### Task 7: API route — `/api/road-trip/generate`

**Files:**
- Create: `src/app/api/road-trip/generate/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// src/app/api/road-trip/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Groq from 'groq-sdk'
import { Resend } from 'resend'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { buildRoadTripEmail } from '@/emails/road-trip'
import {
  INTERETS_OPTIONS,
  MOIS_OPTIONS,
} from '@/lib/road-trip/constants'

export const maxDuration = 60

// ── Rate limiting (in-memory, best-effort) ───────────────────────────────────
const ipRequestMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRequestMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const InteretEnum = z.enum(
  INTERETS_OPTIONS.map((o) => o.value) as [string, ...string[]]
)

const RoadTripSchema = z.object({
  prenom: z.string().min(2).max(50),
  email: z.string().email(),
  region: z.string().min(2).max(100),
  duree: z.coerce.number().int().min(1).max(14),
  interets: z.array(InteretEnum).min(1).max(7),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})

type RoadTripInput = z.infer<typeof RoadTripSchema>

// ── Groq itinerary generation ─────────────────────────────────────────────────
interface JourItineraire {
  numero: number
  titre: string
  spots: Array<{ nom: string; description: string; type: string }>
  camping: string
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

async function generateItineraire(
  input: RoadTripInput,
  tavilyContext: string
): Promise<ItineraireData> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const interetsLabels = input.interets
    .map((v) => INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(', ')

  const styleDesc = {
    lent: 'rythme lent avec 2-3 stops maximum, immersion profonde dans chaque lieu',
    explorer: 'maximum de spots et de découvertes, rythme soutenu',
    aventure: 'nature sauvage, off-road, bivouacs isolés',
  }[input.style_voyage]

  const budgetDesc = {
    economique: 'camping gratuit, bivouac, aires naturelles',
    confort: 'aires de camping-cars payantes avec équipements, campings 2-3 étoiles',
    premium: 'glamping, campings premium, spots exclusifs',
  }[input.budget]

  const profilDesc = {
    solo: 'voyageur solo',
    couple: 'couple',
    famille: 'famille avec enfants (adapter avec activités kids-friendly)',
    amis: 'groupe d\'amis',
  }[input.profil_voyageur]

  const systemPrompt = `Tu es un expert du voyage en van en France. Tu génères des itinéraires road trip détaillés, authentiques et pratiques.
Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après. Le JSON doit respecter exactement ce schéma :
{
  "intro": "string (2-3 phrases d'intro sur la région et le voyage)",
  "jours": [
    {
      "numero": 1,
      "titre": "string (titre évocateur du jour)",
      "spots": [
        { "nom": "string", "description": "string (2-3 phrases)", "type": "string (Village, Plage, Montagne, Forêt, etc.)" }
      ],
      "camping": "string (lieu précis où dormir ce soir)",
      "tips": "string (astuce pratique van pour ce jour)"
    }
  ],
  "conseils_pratiques": ["string", "string", "string"]
}`

  const userPrompt = `Génère un road trip en van de ${input.duree} jours en ${input.region}, France.
Profil : ${profilDesc}
Intérêts : ${interetsLabels}
Style : ${styleDesc}
Budget hébergement : ${budgetDesc}
Période : ${input.periode}
Expérience van : ${input.experience_van ? 'habitué' : 'première fois'}

Informations trouvées sur la région (utilise-les comme inspiration) :
${tavilyContext || 'Pas de contexte supplémentaire — utilise tes connaissances générales.'}

Important : génère exactement ${input.duree} jours. Chaque jour = 2-3 spots. Spots réels et précis.`

  async function callGroq(temperature: number): Promise<ItineraireData> {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 3000,
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(raw) as ItineraireData
  }

  try {
    return await callGroq(0.7)
  } catch {
    // Retry once with temperature=0 on any failure (JSON parse error or API error).
    // This is intentional: if the API is down, second call will also fail and
    // propagate to the outer catch in POST handler → status = 'error'.
    return await callGroq(0)
  }
}

// ── Tavily search ─────────────────────────────────────────────────────────────
async function searchTavily(input: RoadTripInput): Promise<string> {
  try {
    const interetsLabels = input.interets
      .map((v) => INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v)
      .join(' ')

    const query = `road trip van ${input.region} France spots activités ${interetsLabels} ${input.periode}`

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 6,
        include_answer: false,
      }),
    })

    if (!res.ok) return ''

    const data = (await res.json()) as {
      results?: Array<{ title?: string; content?: string }>
    }

    return (data.results ?? [])
      .slice(0, 6)
      .map((r) => `${r.title ?? ''}: ${r.content ?? ''}`)
      .join('\n\n')
      .slice(0, 3000)
  } catch {
    return ''
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Trop de demandes, réessaie dans une heure.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Données invalides.' },
      { status: 400 }
    )
  }

  // Validate
  const parsed = RoadTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createSupabaseAdmin()

  // Check unsubscribes — maybeSingle() returns null (not error) when no row found
  const { data: unsub } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email', input.email)
    .maybeSingle()

  if (unsub) {
    return NextResponse.json(
      { success: false, error: 'Cet email est désabonné.' },
      { status: 400 }
    )
  }

  // Deduplication — 24h cooldown — maybeSingle() returns null when no row found
  const { data: existing } = await supabase
    .from('road_trip_requests')
    .select('id')
    .eq('email', input.email)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'Tu as déjà reçu un road trip aujourd\'hui. Réessaie demain !' },
      { status: 429 }
    )
  }

  // Save to Supabase (pending)
  const { data: record, error: insertError } = await supabase
    .from('road_trip_requests')
    .insert({
      prenom: input.prenom,
      email: input.email,
      region: input.region,
      duree: input.duree,
      interets: input.interets,
      style_voyage: input.style_voyage,
      periode: input.periode,
      profil_voyageur: input.profil_voyageur,
      budget: input.budget,
      experience_van: input.experience_van,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !record) {
    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessaie dans quelques instants.' },
      { status: 500 }
    )
  }

  try {
    // Tavily search
    const tavilyContext = await searchTavily(input)

    // Groq generation
    const itineraire = await generateItineraire(input, tavilyContext)

    // Build email
    const emailEncoded = encodeURIComponent(input.email)
    const { subject, html } = buildRoadTripEmail({
      prenom: input.prenom,
      region: input.region,
      duree: input.duree,
      itineraire,
      emailEncoded,
    })

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Vanzon Explorer <roadtrip@vanzonexplorer.com>',
      to: input.email,
      subject,
      html,
    })

    // Update Supabase (sent)
    await supabase
      .from('road_trip_requests')
      .update({
        status: 'sent',
        itineraire_json: itineraire,
        sent_at: new Date().toISOString(),
      })
      .eq('id', record.id)

    return NextResponse.json({ success: true, message: 'Road trip envoyé !' })
  } catch (err) {
    console.error('[road-trip/generate]', err)

    // Mark as error in Supabase
    await supabase
      .from('road_trip_requests')
      .update({ status: 'error' })
      .eq('id', record.id)

    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessaie dans quelques instants.' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Test manually with curl**

```bash
curl -X POST http://localhost:3000/api/road-trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prenom": "Test",
    "email": "test@example.com",
    "region": "Bretagne",
    "duree": 3,
    "interets": ["nature_rando", "plages_surf"],
    "style_voyage": "explorer",
    "periode": "juillet",
    "profil_voyageur": "couple",
    "budget": "confort",
    "experience_van": false
  }'
```

Expected: `{"success":true,"message":"Road trip envoyé !"}` and email received.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/road-trip/generate/route.ts
git commit -m "feat(road-trip): API route with Tavily+Groq+Resend pipeline"
```

---

### Task 8: Unsubscribe API + page

**Files:**
- Create: `src/app/api/unsubscribe/route.ts`
- Create: `src/app/(site)/unsubscribe/page.tsx`

- [ ] **Step 1: Create unsubscribe API route**

```typescript
// src/app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url))
  }

  const supabase = createSupabaseAdmin()
  await supabase
    .from('email_unsubscribes')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

  return NextResponse.redirect(new URL('/unsubscribe?success=1', req.url))
}
```

- [ ] **Step 2: Create unsubscribe page**

```tsx
// src/app/(site)/unsubscribe/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Désabonnement | Vanzon Explorer',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string }
}) {
  const success = searchParams.success === '1'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {success ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Désabonnement confirmé
            </h1>
            <p className="text-text-secondary mb-6">
              Tu ne recevras plus d&apos;emails de road trip de notre part.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-text-secondary mb-6">
              Le lien de désabonnement est invalide. Contacte-nous directement.
            </p>
          </>
        )}
        <Link href="/" className="btn-primary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/unsubscribe/route.ts src/app/(site)/unsubscribe/page.tsx
git commit -m "feat(road-trip): unsubscribe API + page (RGPD)"
```

---

## Chunk 3: Frontend — Wizard + Page

### Task 9: Road Trip Wizard (Client Component)

**Files:**
- Create: `src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx`

- [ ] **Step 1: Create the wizard component**

```tsx
// src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  INTERETS_OPTIONS,
  MOIS_OPTIONS,
  STYLE_VOYAGE_OPTIONS,
  PROFIL_VOYAGEUR_OPTIONS,
  BUDGET_OPTIONS,
  DUREE_OPTIONS,
} from '@/lib/road-trip/constants'

// ── Zod schema (mirrors API schema) ──────────────────────────────────────────
const InteretEnum = z.enum(
  INTERETS_OPTIONS.map((o) => o.value) as [string, ...string[]]
)

const WizardSchema = z.object({
  prenom: z.string().min(2, 'Min 2 caractères'),
  email: z.string().email('Email invalide'),
  region: z.string().min(2, 'Indique une région'),
  duree: z.coerce.number().int().min(1).max(14),
  interets: z.array(InteretEnum).min(1, 'Choisis au moins un intérêt'),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})

type WizardData = z.infer<typeof WizardSchema>

const TOTAL_STEPS = 4

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
}

export default function RoadTripWizard() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WizardData>({
    resolver: zodResolver(WizardSchema),
    defaultValues: {
      duree: 5,
      interets: [],
      style_voyage: 'explorer',
      periode: 'juillet',
      profil_voyageur: 'couple',
      budget: 'confort',
      experience_van: false,
    },
  })

  const watchInterets = watch('interets')
  const watchStyle = watch('style_voyage')
  const watchProfil = watch('profil_voyageur')
  const watchBudget = watch('budget')
  const watchExperience = watch('experience_van')

  // Fields to validate per step before advancing
  const STEP_FIELDS: Record<number, (keyof WizardData)[]> = {
    1: ['prenom', 'email', 'region', 'duree'],
    2: ['interets', 'style_voyage', 'periode'],
    3: ['profil_voyageur', 'budget', 'experience_van'],
  }

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) return
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function goPrev() {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  function toggleInteret(value: InteretValue) {
    const current = watchInterets ?? []
    if (current.includes(value)) {
      setValue('interets', current.filter((v) => v !== value))
    } else {
      setValue('interets', [...current, value])
    }
  }

  async function onSubmit(data: WizardData) {
    setStatus('loading')
    try {
      const res = await fetch('/api/road-trip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (json.success) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 text-center max-w-lg mx-auto"
      >
        <div className="text-6xl mb-6">🚐</div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">
          Ton road trip arrive !
        </h2>
        <p className="text-text-secondary leading-relaxed">
          On génère ton itinéraire personnalisé et on te l&apos;envoie par email dans
          les prochaines minutes. Vérifie bien tes spams !
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </motion.div>
    )
  }

  return (
    <div id="wizard" className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                s < step
                  ? 'bg-accent-blue text-white'
                  : s === step
                  ? 'bg-accent-blue/20 text-accent-blue border-2 border-accent-blue'
                  : 'bg-white/5 text-text-secondary'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full"
            animate={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Steps */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Step 1 — Ton van trip */}
            {step === 1 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-1">Ton van trip</h2>
                <p className="text-text-secondary mb-6">Où veux-tu aller et combien de temps ?</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Prénom</label>
                    <input
                      {...register('prenom')}
                      placeholder="Jules"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue transition-colors"
                    />
                    {errors.prenom && <p className="text-red-400 text-sm mt-1">{errors.prenom.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="jules@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue transition-colors"
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Région / Destination</label>
                    <input
                      {...register('region')}
                      placeholder="Bretagne, Alpes, Côte d'Azur…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-blue transition-colors"
                    />
                    {errors.region && <p className="text-red-400 text-sm mt-1">{errors.region.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Durée du road trip</label>
                    <select
                      {...register('duree', { valueAsNumber: true })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                    >
                      {DUREE_OPTIONS.map((d) => (
                        <option key={d} value={d} className="bg-bg-primary">
                          {d} jour{d > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Tes envies */}
            {step === 2 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-1">Tes envies</h2>
                <p className="text-text-secondary mb-6">Qu&apos;est-ce qui te fait vibrer ?</p>

                <div className="space-y-6">
                  {/* Intérêts */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Centres d&apos;intérêt</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERETS_OPTIONS.map((opt) => {
                        const selected = watchInterets?.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleInteret(opt.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              selected
                                ? 'bg-accent-blue text-white'
                                : 'bg-white/5 text-text-secondary border border-white/10 hover:border-accent-blue/50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {errors.interets && <p className="text-red-400 text-sm mt-2">Choisis au moins un intérêt</p>}
                  </div>

                  {/* Style de voyage */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Style de voyage</label>
                    <div className="grid grid-cols-1 gap-3">
                      {STYLE_VOYAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setValue('style_voyage', opt.value)}
                          className={`p-4 rounded-xl text-left transition-all border ${
                            watchStyle === opt.value
                              ? 'border-accent-blue bg-accent-blue/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <p className="font-semibold text-text-primary">{opt.label}</p>
                          <p className="text-sm text-text-secondary mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Période */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Période de départ</label>
                    <select
                      {...register('periode')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-blue"
                    >
                      {MOIS_OPTIONS.map((m) => (
                        <option key={m} value={m} className="bg-bg-primary capitalize">
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Ton profil */}
            {step === 3 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-1">Ton profil</h2>
                <p className="text-text-secondary mb-6">Pour adapter l&apos;itinéraire à ta situation</p>

                <div className="space-y-6">
                  {/* Profil voyageur */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Vous êtes</label>
                    <div className="grid grid-cols-2 gap-3">
                      {PROFIL_VOYAGEUR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setValue('profil_voyageur', opt.value)}
                          className={`p-4 rounded-xl text-center transition-all border ${
                            watchProfil === opt.value
                              ? 'border-accent-blue bg-accent-blue/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="text-2xl mb-1">{opt.emoji}</div>
                          <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Budget hébergement</label>
                    <div className="grid grid-cols-1 gap-3">
                      {BUDGET_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setValue('budget', opt.value)}
                          className={`p-4 rounded-xl text-left transition-all border ${
                            watchBudget === opt.value
                              ? 'border-accent-blue bg-accent-blue/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <p className="font-semibold text-text-primary capitalize">{opt.label}</p>
                          <p className="text-sm text-text-secondary mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expérience van */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">Expérience en van</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Première fois', value: false },
                        { label: 'Habitué', value: true },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setValue('experience_van', opt.value)}
                          className={`p-4 rounded-xl text-center transition-all border ${
                            watchExperience === opt.value
                              ? 'border-accent-blue bg-accent-blue/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Confirmation */}
            {step === 4 && (
              <div className="glass-card p-8">
                <h2 className="text-2xl font-bold text-text-primary mb-1">Prêt à partir ?</h2>
                <p className="text-text-secondary mb-6">Récapitulatif de ta demande</p>

                <div className="space-y-3 mb-8">
                  {[
                    ['📍 Destination', `${watch('region')} — ${watch('duree')} jours`],
                    ['📅 Période', watch('periode')],
                    ['🎯 Style', STYLE_VOYAGE_OPTIONS.find((o) => o.value === watchStyle)?.label ?? ''],
                    ['👥 Profil', PROFIL_VOYAGEUR_OPTIONS.find((o) => o.value === watchProfil)?.label ?? ''],
                    ['💰 Budget', BUDGET_OPTIONS.find((o) => o.value === watchBudget)?.label ?? ''],
                    ['📧 Email', watch('email')],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <span className="text-text-secondary text-sm">{label}</span>
                      <span className="text-text-primary text-sm font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                {status === 'error' && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    Une erreur est survenue, réessaie dans quelques instants.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary w-full py-4 text-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Génération en cours…
                    </span>
                  ) : (
                    '🚐 Générer mon road trip'
                  )}
                </button>

                <p className="text-center text-text-secondary text-xs mt-3">
                  Tu recevras ton itinéraire complet par email.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {status !== 'success' && (
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="btn-ghost px-6 py-2.5 text-sm"
              >
                ← Retour
              </button>
            ) : (
              <div />
            )}
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                Suivant →
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(site)/road-trip-personnalise/RoadTripWizard.tsx
git commit -m "feat(road-trip): 4-step wizard with glassmorphism design"
```

---

### Task 10: Public page `/road-trip-personnalise`

**Files:**
- Create: `src/app/(site)/road-trip-personnalise/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(site)/road-trip-personnalise/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'

export const metadata: Metadata = {
  title: 'Crée ton road trip en van personnalisé | Vanzon Explorer',
  description:
    'Génère gratuitement ton itinéraire road trip en van sur mesure. Spots, activités, camping selon tes envies et ta destination en France.',
  openGraph: {
    title: 'Road Trip Van Personnalisé | Vanzon Explorer',
    description: 'Ton itinéraire road trip en van, partout en France, en quelques clics.',
    type: 'website',
  },
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Remplis le formulaire',
    desc: 'Région, durée, intérêts, profil… 2 minutes chrono.',
  },
  {
    step: '02',
    title: 'On génère ton itinéraire',
    desc: 'Notre IA scrape les meilleurs spots et compose ton road trip jour par jour.',
  },
  {
    step: '03',
    title: 'Tu reçois tout par email',
    desc: 'Spots, campings, conseils van — prêt à partir !',
  },
]

export default function RoadTripPersonnalisePage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="badge-glass inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm">
            <span className="text-accent-blue">🗺️</span>
            <span className="text-text-secondary">Générateur IA — 100% gratuit</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl text-text-primary leading-tight mb-6">
            Ton road trip en van{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              sur mesure
            </span>
            ,<br />partout en France
          </h1>

          <p className="text-text-secondary text-xl leading-relaxed mb-10 max-w-xl mx-auto">
            Indique ta destination, tes envies et ton profil. On génère un itinéraire
            complet jour par jour et on te l&apos;envoie directement par email.
          </p>

          <a
            href="#wizard"
            className="btn-primary px-8 py-4 text-lg font-bold inline-block"
          >
            Créer mon itinéraire gratuitement 🚐
          </a>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-text-primary mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="glass-card p-6 text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl font-display text-2xl mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
                    color: 'white',
                  }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wizard ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" id="wizard">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              Génère ton itinéraire
            </h2>
            <p className="text-text-secondary">
              Prend 2 minutes — reçois ton road trip complet par email
            </p>
          </div>
          <RoadTripWizard />
        </div>
      </section>

      {/* ── CTA secondaire ────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-text-secondary mb-4">
            Tu as ton itinéraire ? Il te faut un van !
          </p>
          <Link href="/location" className="btn-primary px-8 py-3 inline-block">
            Louer un van Vanzon Explorer
          </Link>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: build successful, no errors.

- [ ] **Step 4: Manual browser test**

Start dev server: `npm run dev`
Open: `http://localhost:3000/road-trip-personnalise`
Verify: hero, "comment ça marche", wizard visible and functional.

- [ ] **Step 5: Commit**

```bash
git add src/app/(site)/road-trip-personnalise/page.tsx
git commit -m "feat(road-trip): public page with hero, how-it-works, wizard"
```

---

## Chunk 4: Admin Dashboard + Navigation

### Task 11: Admin dashboard `/admin/road-trips`

**Files:**
- Create: `src/app/admin/(protected)/road-trips/page.tsx`

- [ ] **Step 1: Create admin page**

```tsx
// src/app/admin/(protected)/road-trips/page.tsx
import { Metadata } from 'next'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Road Trips — Vanzon Admin',
  robots: { index: false, follow: false },
}

interface RoadTripRequest {
  id: string
  prenom: string
  email: string
  region: string
  duree: number
  profil_voyageur: string
  budget: string
  status: string
  created_at: string
  interets: string[]
}

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
}

export default async function RoadTripsAdminPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; region?: string }
}) {
  const supabase = createSupabaseAdmin()
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const pageSize = 50
  const offset = (page - 1) * pageSize

  // Build query
  let query = supabase
    .from('road_trip_requests')
    .select('id, prenom, email, region, duree, profil_voyageur, budget, status, created_at, interets', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.region) query = query.ilike('region', `%${searchParams.region}%`)

  const { data: requests, count } = await query

  // Stats
  const { count: totalCount } = await supabase
    .from('road_trip_requests')
    .select('*', { count: 'exact', head: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayCount } = await supabase
    .from('road_trip_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('created_at', today.toISOString())

  const { count: sentCount } = await supabase
    .from('road_trip_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')

  const successRate =
    totalCount && totalCount > 0
      ? Math.round(((sentCount ?? 0) / totalCount) * 100)
      : 0

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Road Trips</h1>
      <p className="text-slate-500 text-sm mb-8">Demandes d&apos;itinéraires personnalisés</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total demandes', value: totalCount ?? 0, color: 'blue' },
          { label: 'Envoyés aujourd\'hui', value: todayCount ?? 0, color: 'green' },
          { label: 'Taux de succès', value: `${successRate}%`, color: 'purple' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-3 flex-wrap">
        <form className="flex gap-3 flex-wrap w-full">
          <select
            name="status"
            defaultValue={searchParams.status ?? ''}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
          >
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyés</option>
            <option value="pending">En attente</option>
            <option value="error">Erreur</option>
          </select>
          <input
            name="region"
            defaultValue={searchParams.region ?? ''}
            placeholder="Filtrer par région…"
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 flex-1 min-w-[160px]"
          />
          <button
            type="submit"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filtrer
          </button>
          <a
            href="/admin/road-trips"
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
          >
            Réinitialiser
          </a>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Prénom', 'Email', 'Région', 'Durée', 'Profil', 'Budget', 'Statut', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(requests as RoadTripRequest[] ?? []).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.prenom}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email}</td>
                  <td className="px-4 py-3 text-slate-700 capitalize">{r.region}</td>
                  <td className="px-4 py-3 text-slate-600">{r.duree}j</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.profil_voyageur}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.budget}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {(!requests || requests.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Aucune demande pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {count} résultat{(count ?? 0) > 1 ? 's' : ''}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/admin/road-trips?page=${p}${searchParams.status ? `&status=${searchParams.status}` : ''}${searchParams.region ? `&region=${searchParams.region}` : ''}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/road-trips/page.tsx
git commit -m "feat(road-trip): admin dashboard with stats, table, pagination"
```

---

### Task 12: Add "Road Trips" to admin sidebar

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx`

- [ ] **Step 1: Add road-trips to the Analytics navGroup**

In `src/app/admin/_components/AdminSidebar.tsx`, find this exact block (the last item in the Analytics group) and insert the new item **after** the closing `},` of the Blog & Articles entry:

```typescript
      // ← existing last item in Analytics group — insert AFTER this closing brace
      {
        label: "Blog & Articles",
        href: "/admin/blog",
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
      // ← ADD THIS AFTER THE COMMA ABOVE:
      {
        label: "Road Trips",
        href: "/admin/road-trips",
        icon: (
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
      },
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual check**

Open `http://localhost:3000/admin` — verify "Road Trips" appears in the sidebar under Analytics.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat(road-trip): add Road Trips link to admin sidebar"
```

---

### Task 13: Add "Road Trip" to main Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Add to navLinks array**

In `Navbar.tsx`, find the `navLinks` array. After the `Pays Basque` entry (index 4), insert:

```typescript
{ label: "Road Trip", href: "/road-trip-personnalise", desc: "Itinéraire sur mesure", emoji: "🗺️" },
```

The array should become:
```
Location, Achat, Formation, Club Privé, Pays Basque, Road Trip, Articles, À propos, Contact
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual check**

Open `http://localhost:3000` — verify "Road Trip 🗺️" appears in the navbar between "Pays Basque" and "Articles".

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat(road-trip): add Road Trip link to main navbar"
```

---

### Task 14: Update FloatingCTA for road-trip page

**Files:**
- Modify: `src/components/layout/FloatingCTA.tsx`

- [ ] **Step 1: Add road-trip pathname case**

In `src/components/layout/FloatingCTA.tsx`, find this exact block and insert the new case **after** its closing `}`:

```typescript
  // Pays Basque & road trip  ← FIND THIS EXACT BLOCK
  if (
    pathname.startsWith("/pays-basque") ||
    pathname.startsWith("/road-trip-pays-basque-van")
  ) {
    return {
      btnLabel: "Louer un van",
      href: "/location",
      ...PALETTE.blue,
    };
  }
  // ← INSERT AFTER THE CLOSING } ABOVE:

  // Road Trip Personnalisé — générateur IA
  if (pathname === '/road-trip-personnalise') {
    return {
      btnLabel: 'Générer mon itinéraire',
      href: '#wizard',
      ...PALETTE.blue,
    }
  }
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Manual check**

Open `http://localhost:3000/road-trip-personnalise` — verify FloatingCTA shows "Générer mon itinéraire" with blue gradient.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/FloatingCTA.tsx
git commit -m "feat(road-trip): add FloatingCTA case for road-trip page"
```

---

### Task 15: Final build check + deploy

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: build successful, 0 errors, 0 TypeScript errors.

- [ ] **Step 2: Verify all routes**

With `npm run dev`:
- `http://localhost:3000/road-trip-personnalise` — page visible, wizard functional
- `http://localhost:3000/admin/road-trips` — admin page loads (redirects to login if not authenticated)
- `http://localhost:3000/unsubscribe?success=1` — success message visible
- Navbar has "Road Trip 🗺️" between Pays Basque and Articles

- [ ] **Step 3: Test full flow end-to-end**

1. Go to `/road-trip-personnalise`
2. Fill wizard steps 1-4
3. Submit → loading state → success message
4. Check email received with correct branding
5. Check `/admin/road-trips` — row appears with status `sent`

- [ ] **Step 4: Push to main (triggers Vercel deploy)**

```bash
git push origin main
```

Wait for Vercel deploy. Verify production URL works.

- [ ] **Step 5: Final commit tag**

```bash
git tag v-road-trip-1.0
git push origin v-road-trip-1.0
```

---

### Task 16: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add road-trip section to CLAUDE.md**

In `CLAUDE.md`, add the following under the existing `### Key component patterns` section (after the CalendlyButton entry):

```markdown
**Road Trip Personnalisé** (`/road-trip-personnalise`) — public page with 4-step wizard. Client component `RoadTripWizard.tsx` uses react-hook-form + Zod. API route `/api/road-trip/generate` chains Tavily (spot search) → Groq (itinerary JSON) → Resend (branded email). Leads stored in Supabase `road_trip_requests` table. Admin view at `/admin/road-trips`. Shared constants in `src/lib/road-trip/constants.ts`. Email template at `src/emails/road-trip.tsx`. Unsubscribe at `/unsubscribe` + `email_unsubscribes` table.
```

Also add to **Environment Variables** section:
```
RESEND_API_KEY=           # Road Trip Personnalisé — email delivery
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with road-trip feature documentation"
```

---

## Deferred to v2 (out of scope for this plan)

These features are in the spec but deferred to keep the initial implementation focused:

- **Admin itinerary preview modal** — clicking a row to see `itineraire_json` formatted. Requires a Client Component wrapper around the Server Component admin page.
- **Admin CSV export** — download emails/prénoms/régions. Requires an API route returning a CSV stream.
- **Admin date filter** — date picker to filter requests by creation date.
- **Testimonials section** — placeholder section on the road-trip page (no real testimonials yet in v1).
- **Schema.org WebApplication** — `<script type="application/ld+json">` on the page. Low priority for launch.
