# Marketplace Van Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wizard multi-étapes pour les propriétaires de vans + page admin pour gérer les fiches soumises. Pas de pages publiques pour l'instant.

**Architecture:** Formulaire wizard 4 étapes (React Hook Form + Zod) remplaçant le formulaire simple actuel sur `/proposer-votre-van`. Photos uploadées vers Supabase Storage. Données dans table Supabase `marketplace_vans`. Admin CRUD à `/admin/marketplace` avec tableau + détail. Notification Telegram à chaque soumission.

**Tech Stack:** Next.js 14 App Router, React Hook Form, Zod, Supabase (Storage + DB), Tailwind CSS, LiquidButton, glass-card design system.

---

## File Structure

### New files
- `src/app/(site)/proposer-votre-van/_components/VanOnboardingWizard.tsx` — wizard multi-step (remplace VanOwnerForm)
- `src/app/(site)/proposer-votre-van/_components/steps/StepOwner.tsx` — étape 1 identité
- `src/app/(site)/proposer-votre-van/_components/steps/StepVehicle.tsx` — étape 2 véhicule + équipements
- `src/app/(site)/proposer-votre-van/_components/steps/StepPhotos.tsx` — étape 3 photos + description
- `src/app/(site)/proposer-votre-van/_components/steps/StepPricing.tsx` — étape 4 tarif + localisation + lien
- `src/app/(site)/proposer-votre-van/_components/WizardProgressBar.tsx` — barre de progression
- `src/app/(site)/proposer-votre-van/_components/PhotoUploader.tsx` — upload drag & drop pour photos
- `src/app/api/marketplace/submit/route.ts` — POST soumission complète
- `src/app/api/marketplace/upload-photo/route.ts` — POST upload photo individuelle → Supabase Storage
- `src/app/admin/(protected)/marketplace/page.tsx` — page admin tableau
- `src/app/admin/(protected)/marketplace/_components/MarketplaceClient.tsx` — client component avec tableau + filtres + modal détail
- `src/app/admin/(protected)/marketplace/[id]/page.tsx` — page détail/edit admin
- `src/app/api/admin/marketplace/route.ts` — GET liste (admin)
- `src/app/api/admin/marketplace/[id]/route.ts` — PATCH/DELETE (admin)

### Modified files
- `src/app/(site)/proposer-votre-van/page.tsx` — swap VanOwnerForm → VanOnboardingWizard

---

## Chunk 1: Database + API foundation

### Task 1: Créer la table Supabase `marketplace_vans`

**Files:**
- No code file — SQL executed in Supabase Dashboard

- [ ] **Step 1: Créer la table via Supabase SQL Editor**

Exécuter ce SQL dans Supabase Dashboard (ou via `supabase` CLI) :

```sql
CREATE TABLE marketplace_vans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Propriétaire
  owner_first_name TEXT NOT NULL,
  owner_last_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_phone TEXT NOT NULL,

  -- Véhicule
  van_type TEXT NOT NULL CHECK (van_type IN ('fourgon', 'van', 'combi', 'camping-car', 'autre')),
  van_brand TEXT NOT NULL,
  van_model TEXT NOT NULL,
  van_year INTEGER,
  seats INTEGER,
  sleeps INTEGER NOT NULL,
  transmission TEXT DEFAULT 'manuelle' CHECK (transmission IN ('manuelle', 'automatique')),

  -- Équipements (array de strings)
  equipments JSONB DEFAULT '[]'::jsonb,

  -- Contenu
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,

  -- Tarif & localisation
  price_per_day INTEGER NOT NULL,
  min_days INTEGER DEFAULT 2,
  deposit INTEGER,
  location_city TEXT NOT NULL,

  -- Lien réservation externe (libre)
  booking_url TEXT,

  -- Notes admin
  admin_notes TEXT
);

-- Index pour les requêtes admin
CREATE INDEX idx_marketplace_vans_status ON marketplace_vans(status);
CREATE INDEX idx_marketplace_vans_created ON marketplace_vans(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_marketplace_vans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marketplace_vans_updated_at
  BEFORE UPDATE ON marketplace_vans
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_vans_updated_at();
```

- [ ] **Step 2: Créer le bucket Supabase Storage `marketplace-photos`**

Dans Supabase Dashboard → Storage → New Bucket :
- Name: `marketplace-photos`
- Public: **true** (les URLs de photos doivent être accessibles publiquement)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

Ajouter une policy pour permettre l'upload anonyme (rate limited côté API) :

```sql
-- Policy : allow anonymous uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'marketplace-photos');

-- Policy : allow public reads
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'marketplace-photos');
```

---

### Task 2: API route upload photo

**Files:**
- Create: `src/app/api/marketplace/upload-photo/route.ts`

- [ ] **Step 1: Créer la route d'upload photo**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { headers } from "next/headers";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Rate limiting simple en mémoire (reset au redéploiement)
const uploadCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadCounts.set(ip, { count: 1, resetAt: now + 3600000 }); // 1h window
    return true;
  }
  if (entry.count >= 30) return false; // max 30 photos/h/IP
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limit
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de fichiers envoyés. Réessayez plus tard." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop lourd (max 5 Mo)." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `submissions/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("marketplace-photos")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[marketplace/upload-photo]", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload." },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("marketplace-photos")
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("[marketplace/upload-photo]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/marketplace/upload-photo/route.ts
git commit -m "feat(marketplace): add photo upload API route with rate limiting"
```

---

### Task 3: API route submit (soumission wizard)

**Files:**
- Create: `src/app/api/marketplace/submit/route.ts`

- [ ] **Step 1: Créer la route de soumission**

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EQUIPMENT_OPTIONS = [
  "frigo", "plaque-cuisson", "evier", "vaisselle",
  "douche", "wc", "eau-chaude",
  "chauffage", "climatisation", "moustiquaire",
  "panneau-solaire", "220v", "batterie-auxiliaire",
  "store", "porte-velo", "galerie",
  "gps", "camera-recul", "regulateur",
] as const;

const schema = z.object({
  // Étape 1 — Propriétaire
  owner_first_name: z.string().min(2, "Prénom requis"),
  owner_last_name: z.string().min(2, "Nom requis"),
  owner_email: z.string().email("Email invalide"),
  owner_phone: z.string().min(8, "Téléphone requis"),

  // Étape 2 — Véhicule
  van_type: z.enum(["fourgon", "van", "combi", "camping-car", "autre"]),
  van_brand: z.string().min(1, "Marque requise"),
  van_model: z.string().min(1, "Modèle requis"),
  van_year: z.coerce.number().min(1990).max(2027).optional(),
  seats: z.coerce.number().min(1).max(10).optional(),
  sleeps: z.coerce.number().min(1).max(10),
  transmission: z.enum(["manuelle", "automatique"]).default("manuelle"),
  equipments: z.array(z.string()).default([]),

  // Étape 3 — Photos & description
  title: z.string().min(5, "Titre trop court").max(100),
  description: z.string().min(50, "Description trop courte (min 50 caractères)").max(2000),
  photos: z.array(z.string().url()).min(3, "Minimum 3 photos").max(15),

  // Étape 4 — Tarif & localisation
  price_per_day: z.coerce.number().min(20).max(500),
  min_days: z.coerce.number().min(1).max(30).default(2),
  deposit: z.coerce.number().min(0).max(5000).optional(),
  location_city: z.string().min(2, "Ville requise"),
  booking_url: z.string().url("Lien invalide").or(z.literal("")).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("marketplace_vans").insert({
      ...data,
      booking_url: data.booking_url || null,
      deposit: data.deposit || null,
      van_year: data.van_year || null,
      seats: data.seats || null,
    });

    if (error) {
      console.error("[marketplace/submit] Supabase error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement." },
        { status: 500 }
      );
    }

    // Notification Telegram (non-bloquante)
    notifyTelegram(data).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[marketplace/submit] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

async function notifyTelegram(data: z.infer<typeof schema>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚐 <b>Nouvelle fiche van marketplace !</b>\n` +
    `─────────────────────\n` +
    `<b>Proprio :</b> ${data.owner_first_name} ${data.owner_last_name}\n` +
    `<b>Tél :</b> ${data.owner_phone}\n` +
    `<b>Email :</b> ${data.owner_email}\n` +
    `<b>Van :</b> ${data.van_brand} ${data.van_model} (${data.van_type})\n` +
    `<b>Titre :</b> ${data.title}\n` +
    `<b>Prix :</b> ${data.price_per_day}€/jour\n` +
    `<b>Couchages :</b> ${data.sleeps}\n` +
    `<b>Ville :</b> ${data.location_city}\n` +
    `<b>Photos :</b> ${data.photos.length}\n` +
    (data.booking_url ? `<b>Lien :</b> ${data.booking_url}\n` : "") +
    `─────────────────────\n` +
    `→ Vérifier dans /admin/marketplace`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/marketplace/submit/route.ts
git commit -m "feat(marketplace): add wizard submission API route with Telegram notification"
```

---

### Task 4: API routes admin (CRUD)

**Files:**
- Create: `src/app/api/admin/marketplace/route.ts`
- Create: `src/app/api/admin/marketplace/[id]/route.ts`

- [ ] **Step 1: Route GET liste admin**

`src/app/api/admin/marketplace/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("marketplace_vans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/marketplace] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 2: Route PATCH/DELETE détail admin**

`src/app/api/admin/marketplace/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("marketplace_vans")
    .update(body)
    .eq("id", id);

  if (error) {
    console.error("[admin/marketplace] PATCH error:", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("marketplace_vans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/marketplace] DELETE error:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/marketplace/route.ts src/app/api/admin/marketplace/\[id\]/route.ts
git commit -m "feat(marketplace): add admin CRUD API routes"
```

---

## Chunk 2: Wizard frontend

### Task 5: Barre de progression + composant wrapper

**Files:**
- Create: `src/app/(site)/proposer-votre-van/_components/WizardProgressBar.tsx`
- Create: `src/app/(site)/proposer-votre-van/_components/VanOnboardingWizard.tsx`

- [ ] **Step 1: WizardProgressBar**

```tsx
"use client";

const STEPS = [
  { label: "Vous", icon: "👤" },
  { label: "Votre van", icon: "🚐" },
  { label: "Photos", icon: "📸" },
  { label: "Tarif", icon: "💰" },
];

interface Props {
  currentStep: number;
}

export default function WizardProgressBar({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === currentStep;
        const isDone = i < currentStep;

        return (
          <div key={step.label} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i > 0 && (
              <div
                className={`absolute top-5 -left-1/2 w-full h-0.5 transition-colors duration-300 ${
                  isDone ? "bg-blue-500" : "bg-slate-200"
                }`}
              />
            )}

            {/* Circle */}
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isDone
                  ? "bg-blue-500 text-white"
                  : isActive
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? "✓" : step.icon}
            </div>

            {/* Label */}
            <span
              className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                isActive ? "text-blue-600" : isDone ? "text-blue-500" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: VanOnboardingWizard (wrapper multi-step)**

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import WizardProgressBar from "./WizardProgressBar";
import StepOwner from "./steps/StepOwner";
import StepVehicle from "./steps/StepVehicle";
import StepPhotos from "./steps/StepPhotos";
import StepPricing from "./steps/StepPricing";
import LiquidButton from "@/components/ui/LiquidButton";

const STORAGE_KEY = "vanzon-wizard-draft";

export const wizardSchema = z.object({
  // Step 1
  owner_first_name: z.string().min(2, "Prénom requis"),
  owner_last_name: z.string().min(2, "Nom requis"),
  owner_email: z.string().email("Email invalide"),
  owner_phone: z.string().min(8, "Téléphone requis"),
  // Step 2
  van_type: z.enum(["fourgon", "van", "combi", "camping-car", "autre"]),
  van_brand: z.string().min(1, "Marque requise"),
  van_model: z.string().min(1, "Modèle requis"),
  van_year: z.coerce.number().min(1990).max(2027).optional().or(z.literal("")),
  seats: z.coerce.number().min(1).max(10).optional().or(z.literal("")),
  sleeps: z.coerce.number().min(1, "Couchages requis").max(10),
  transmission: z.enum(["manuelle", "automatique"]),
  equipments: z.array(z.string()),
  // Step 3
  title: z.string().min(5, "Titre trop court (min 5 caractères)").max(100),
  description: z.string().min(50, "Description trop courte (min 50 caractères)").max(2000),
  photos: z.array(z.string().url()).min(3, "Minimum 3 photos"),
  // Step 4
  price_per_day: z.coerce.number().min(20, "Minimum 20€/jour").max(500),
  min_days: z.coerce.number().min(1).max(30),
  deposit: z.coerce.number().min(0).max(5000).optional().or(z.literal("")),
  location_city: z.string().min(2, "Ville requise"),
  booking_url: z.string().url("Lien invalide").or(z.literal("")),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

// Champs validés par étape
const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ["owner_first_name", "owner_last_name", "owner_email", "owner_phone"],
  ["van_type", "van_brand", "van_model", "sleeps", "transmission", "equipments"],
  ["title", "description", "photos"],
  ["price_per_day", "min_days", "location_city"],
];

export default function VanOnboardingWizard() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      van_type: "fourgon",
      transmission: "manuelle",
      equipments: [],
      photos: [],
      min_days: 2,
      booking_url: "",
    },
    mode: "onTouched",
  });

  const { handleSubmit, trigger, getValues, reset, formState: { isSubmitting } } = methods;

  // Charger le brouillon depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset({ ...methods.getValues(), ...parsed });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarder dans localStorage à chaque changement d'étape
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
    } catch {}
  }, [getValues]);

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (!valid) return;
    saveDraft();
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    saveDraft();
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(data: WizardFormData) {
    setServerError("");
    try {
      const payload = {
        ...data,
        van_year: data.van_year || undefined,
        seats: data.seats || undefined,
        deposit: data.deposit || undefined,
      };

      const res = await fetch("/api/marketplace/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Une erreur est survenue.");
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Erreur de connexion. Réessayez.");
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">
          Votre van a été soumis !
        </h3>
        <p className="text-text-secondary leading-relaxed">
          On vérifie votre fiche et on vous recontacte sous 24h
          pour confirmer la mise en ligne. Merci de votre confiance !
        </p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="glass-card p-6 sm:p-8">
        <WizardProgressBar currentStep={step} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 0 && <StepOwner />}
          {step === 1 && <StepVehicle />}
          {step === 2 && <StepPhotos />}
          {step === 3 && <StepPricing />}

          {serverError && (
            <p className="text-red-500 text-sm text-center mt-4">{serverError}</p>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Retour
              </button>
            )}

            {step < 3 ? (
              <LiquidButton
                type="button"
                variant="blue"
                size="lg"
                fullWidth
                onClick={goNext}
              >
                Continuer
              </LiquidButton>
            ) : (
              <LiquidButton
                type="submit"
                variant="blue"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Soumettre mon van"}
              </LiquidButton>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(site\)/proposer-votre-van/_components/WizardProgressBar.tsx src/app/\(site\)/proposer-votre-van/_components/VanOnboardingWizard.tsx
git commit -m "feat(marketplace): add wizard wrapper with progress bar and localStorage persistence"
```

---

### Task 6: Step components (1-4)

**Files:**
- Create: `src/app/(site)/proposer-votre-van/_components/steps/StepOwner.tsx`
- Create: `src/app/(site)/proposer-votre-van/_components/steps/StepVehicle.tsx`
- Create: `src/app/(site)/proposer-votre-van/_components/steps/StepPhotos.tsx`
- Create: `src/app/(site)/proposer-votre-van/_components/steps/StepPricing.tsx`
- Create: `src/app/(site)/proposer-votre-van/_components/PhotoUploader.tsx`

- [ ] **Step 1: StepOwner**

Champs : prénom, nom, email, téléphone. Style identique au formulaire actuel (inputCls). 2 colonnes pour prénom/nom.

- [ ] **Step 2: StepVehicle**

Champs : type (select 5 options), marque (input), modèle (input), année (number optionnel), places (number optionnel), couchages (number), boîte (radio manuelle/auto).
Checklist équipements : grille de checkboxes 2-3 colonnes avec les 18 options d'équipements groupées par catégorie (Cuisine, Sanitaires, Énergie, Extérieur, Véhicule).

- [ ] **Step 3: StepPhotos**

PhotoUploader : zone de drag & drop + bouton. Upload chaque fichier vers `/api/marketplace/upload-photo`, affiche les previews en grille. Bouton supprimer par photo. Compteur "X/15 photos".
Champs : titre annonce (input), description (textarea avec compteur caractères).

- [ ] **Step 4: StepPricing**

Champs : prix/jour (number input avec "€/jour"), durée min (number avec défaut 2), caution (number optionnel avec "€"), ville (input), lien de réservation (input URL avec placeholder "https://www.yescapa.fr/... ou leboncoin.fr/... ou tout autre lien").

- [ ] **Step 5: Commit**

```bash
git add src/app/\(site\)/proposer-votre-van/_components/steps/ src/app/\(site\)/proposer-votre-van/_components/PhotoUploader.tsx
git commit -m "feat(marketplace): add all 4 wizard step components with photo uploader"
```

---

### Task 7: Brancher le wizard dans la page

**Files:**
- Modify: `src/app/(site)/proposer-votre-van/page.tsx`

- [ ] **Step 1: Remplacer VanOwnerForm par VanOnboardingWizard**

Changer l'import de `VanOwnerForm` vers `VanOnboardingWizard`. Le reste de la page (hero, avantages, étapes) reste identique. La section formulaire utilise le wizard en pleine largeur (supprimer le grid 2 colonnes pour donner plus de place au wizard).

- [ ] **Step 2: Commit**

```bash
git add src/app/\(site\)/proposer-votre-van/page.tsx
git commit -m "feat(marketplace): wire wizard into proposer-votre-van page"
```

---

## Chunk 3: Admin dashboard

### Task 8: Page admin marketplace

**Files:**
- Create: `src/app/admin/(protected)/marketplace/page.tsx`
- Create: `src/app/admin/(protected)/marketplace/_components/MarketplaceClient.tsx`

- [ ] **Step 1: Server page**

Fetch tous les `marketplace_vans` depuis Supabase côté serveur, passe les données au client component. Pattern identique à `/admin/backlinks/page.tsx`.

- [ ] **Step 2: MarketplaceClient**

Client component avec :
- **Filtres** : 3 boutons (Tous / En attente / Approuvés / Rejetés) avec compteurs
- **Tableau** : colonnes Photo (thumbnail 1ère photo), Van (marque modèle), Proprio (nom), Ville, Prix, Status (badge coloré), Date, Actions
- **Clic sur une ligne** → navigue vers `/admin/marketplace/[id]`
- **Action rapide** : boutons Approuver/Rejeter directement dans le tableau (PATCH `/api/admin/marketplace/[id]`)

Style : identique à la page admin vans existante (bg-white rounded-2xl shadow-sm, table headers en uppercase text-xs text-slate-400).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/\(protected\)/marketplace/
git commit -m "feat(marketplace): add admin marketplace listing page with status management"
```

---

### Task 9: Page détail admin

**Files:**
- Create: `src/app/admin/(protected)/marketplace/[id]/page.tsx`

- [ ] **Step 1: Page détail**

Server component qui fetch un van par ID depuis Supabase. Affiche :
- **Header** : titre + badges status + boutons Approuver/Rejeter/Supprimer
- **Section Propriétaire** : nom, email (lien mailto), téléphone (lien tel), date soumission
- **Section Véhicule** : type, marque, modèle, année, places, couchages, boîte, équipements (badges)
- **Section Photos** : grille de photos (clickable pour agrandir)
- **Section Tarif** : prix/jour, durée min, caution, ville, lien réservation (lien externe)
- **Section Admin** : textarea notes admin + bouton sauvegarder
- **Lien retour** vers `/admin/marketplace`

Design : glass-card sections empilées, même style que les autres pages admin de détail.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/\(protected\)/marketplace/\[id\]/
git commit -m "feat(marketplace): add admin marketplace detail page"
```

---

### Task 10: Ajouter le lien dans la navigation admin

**Files:**
- Modify: le composant de sidebar/navigation admin (chercher `AdminShell` ou la sidebar)

- [ ] **Step 1: Ajouter l'entrée "Marketplace" dans la sidebar admin**

Ajouter entre les entrées existantes, avec une icône appropriée (Store ou ShoppingBag de lucide-react).

- [ ] **Step 2: Commit final + test complet**

```bash
git add -A
git commit -m "feat(marketplace): add marketplace link to admin sidebar navigation"
```

---

## Chunk 4: Vérification

### Task 11: Test end-to-end manuel

- [ ] **Step 1: Vérifier que `npm run build` passe sans erreur**
- [ ] **Step 2: Tester le wizard complet** — remplir les 4 étapes, upload photos, soumettre
- [ ] **Step 3: Vérifier la notification Telegram**
- [ ] **Step 4: Vérifier la page admin** — la soumission apparaît dans le tableau
- [ ] **Step 5: Tester Approuver/Rejeter** depuis la page détail admin
- [ ] **Step 6: Vérifier la persistence localStorage** — fermer/rouvrir le wizard, les données sont restaurées
