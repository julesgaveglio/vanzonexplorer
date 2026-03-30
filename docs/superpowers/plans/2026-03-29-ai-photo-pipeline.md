# AI Photo Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lorsqu'un admin uploade une photo de van, Sharp la recadre en 3:2 WebP, Gemini Flash Vision analyse l'image et génère un alt text + caption + filename SEO en français, et les champs du formulaire sont pré-remplis automatiquement. Les pages du site se mettent à jour en <5s via ISR Sanity.

**Architecture:** Le pipeline s'insère dans l'endpoint POST `/api/admin/upload` existant : buffer → Sharp (resize 1200×800 WebP) → Gemini Vision (alt/caption/filename) → upload Sanity avec les métadonnées enrichies. Le VanForm pré-remplit les champs alt avec les suggestions IA. L'ISR revalidation existante est corrigée pour inclure les pages individuelles des vans.

**Tech Stack:** Sharp 0.34.x (déjà installé), Gemini 2.0 Flash via REST (GEMINI_API_KEY déjà configuré), Sanity write client existant.

---

## Chunk 1 : Utilities IA (processor + analyzer)

### Task 1 : Image Processor (Sharp)

**Files:**
- Create: `src/lib/ai/imageProcessor.ts`

- [ ] **Step 1 : Créer `src/lib/ai/imageProcessor.ts`**

```typescript
import sharp from "sharp";

// Toutes les photos de vans sont en 3:2 (format galerie Sanity : 900×600).
// L'image principale utilise le même ratio pour cohérence visuelle.
export type ImageRole = "gallery";

const PRESETS: Record<ImageRole, { width: number; height: number }> = {
  gallery: { width: 1200, height: 800 },   // 3:2 — cohérent avec imagePresets.gallery (900×600)
};

/**
 * Recadre et convertit une image en WebP optimisé.
 * Toujours 1200×800 (3:2), qualité 85.
 * L'input est attendu post-upload de l'utilisateur (taille quelconque).
 */
export async function processVanImage(
  buffer: Buffer,
  role: ImageRole = "gallery"
): Promise<Buffer> {
  const { width, height } = PRESETS[role];
  return sharp(buffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();
}
```

- [ ] **Step 2 : Vérifier que sharp est accessible**

```bash
npx tsx -e "import sharp from 'sharp'; console.log(sharp.versions)"
```

Expected : objet avec `{ vips: '...', sharp: '...' }`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/ai/imageProcessor.ts
git commit -m "feat(upload): add sharp image processor for van photos (3:2 WebP)"
```

---

### Task 2 : Image Analyzer (Gemini Vision)

**Files:**
- Create: `src/lib/ai/imageAnalyzer.ts`

- [ ] **Step 1 : Créer `src/lib/ai/imageAnalyzer.ts`**

```typescript
// Exporter les types pour que l'upload route puisse les importer sans redéclaration.
export interface VanImageAnalysis {
  alt: string;       // texte alternatif SEO (50-120 chars, français)
  caption: string;   // légende courte (max 80 chars)
  filename: string;  // slug kebab-case sans extension — utilisé comme title du mediaAsset Sanity
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

/**
 * Analyse une image WebP via Gemini 2.0 Flash Vision
 * et retourne les métadonnées SEO optimisées.
 */
export async function analyzeVanImage(
  webpBuffer: Buffer,
  context: { vanName?: string; city?: string } = {}
): Promise<VanImageAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      alt: context.vanName ? `${context.vanName} — van aménagé Pays Basque` : "Van aménagé Pays Basque",
      caption: "Van aménagé Vanzon Explorer",
      filename: "van-amenage-pays-basque",
    };
  }

  const base64 = webpBuffer.toString("base64");
  const vanCtx = context.vanName ? `Le van s'appelle "${context.vanName}".` : "";
  const cityCtx = context.city ? `Région : ${context.city}.` : "Région : Pays Basque.";

  const prompt = `Tu es expert SEO pour une activité de location de vans aménagés. ${vanCtx} ${cityCtx}

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de balises) :
{
  "alt": "<texte alternatif SEO en français, 50-120 caractères, décrit précisément ce qu'on voit, inclut le contexte vanlife/Pays Basque>",
  "caption": "<légende courte en français, max 80 caractères, accrocheur>",
  "filename": "<slug kebab-case, 3-6 mots clés SEO séparés par des tirets, sans extension>"
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: "image/webp", data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini ${res.status}`);

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as VanImageAnalysis;

    return {
      alt: String(parsed.alt || "").slice(0, 200),
      caption: String(parsed.caption || "").slice(0, 100),
      filename: String(parsed.filename || "van-amenage").replace(/[^a-z0-9-]/g, "-").slice(0, 80),
    };
  } catch (err) {
    console.warn("[imageAnalyzer] Gemini fallback:", err);
    return {
      alt: context.vanName ? `Intérieur ${context.vanName} — van aménagé Pays Basque` : "Van aménagé tout équipé Pays Basque",
      caption: "Van aménagé Vanzon Explorer",
      filename: "van-amenage-pays-basque",
    };
  }
}
```

- [ ] **Step 2 : Vérifier la syntaxe TypeScript**

```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep imageAnalyzer
```

Expected : aucune erreur sur `imageAnalyzer.ts`

- [ ] **Step 3 : Commit**

```bash
git add src/lib/ai/imageAnalyzer.ts
git commit -m "feat(upload): add Gemini Vision image analyzer for SEO metadata"
```

---

## Chunk 2 : Upload route + VanForm UI

### Task 3 : Upgrade de `/api/admin/upload`

**Files:**
- Modify: `src/app/api/admin/upload/route.ts`

- [ ] **Step 1 : Remplacer le contenu de `route.ts`**

```typescript
import { createClient } from "@sanity/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { processVanImage } from "@/lib/ai/imageProcessor";
import { analyzeVanImage } from "@/lib/ai/imageAnalyzer";
import type { ImageRole } from "@/lib/ai/imageProcessor";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Non autorise" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Sans titre";
    const alt = (formData.get("alt") as string) || "";
    const category = (formData.get("category") as string) || "divers";
    const imageRole = ((formData.get("imageRole") as string) || "gallery") as ImageRole;
    const vanName = (formData.get("vanName") as string) || undefined;

    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ── 1. Traitement Sharp : recadrage 3:2 ou 16:9 + conversion WebP ──
    const processedBuffer = await processVanImage(rawBuffer, imageRole);

    // ── 2. Analyse Gemini Vision (en parallèle avec upload possible) ──
    const [asset, aiMeta] = await Promise.all([
      writeClient.assets.upload("image", processedBuffer, {
        filename: `${vanName ? vanName.toLowerCase().replace(/\s+/g, "-") + "-" : ""}van-amenage.webp`,
        contentType: "image/webp",
      }),
      analyzeVanImage(processedBuffer, { vanName }),
    ]);

    // ── 3. Créer le document mediaAsset avec les métadonnées IA ──
    const finalAlt = alt || aiMeta.alt;
    const doc = await writeClient.create({
      _type: "mediaAsset",
      title: title || aiMeta.filename,
      category,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: finalAlt,
        hotspot: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    });

    return Response.json({
      success: true,
      assetId: asset._id,
      docId: doc._id,
      url: asset.url,
      webpUrl: `${asset.url}?auto=format&fit=max&q=85`,
      dimensions: asset.metadata?.dimensions,
      // Suggestions IA pour pré-remplir le formulaire
      aiAlt: aiMeta.alt,
      aiCaption: aiMeta.caption,
      aiFilename: aiMeta.filename,
    });
  } catch (err) {
    console.error("[upload]", err);
    return Response.json({ error: "Erreur upload Sanity" }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -10
```

Expected : `✓ Compiled successfully`

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/admin/upload/route.ts
git commit -m "feat(upload): integrate Sharp + Gemini Vision pipeline in upload endpoint"
```

---

### Task 4 : VanForm — pré-remplissage IA

**Files:**
- Modify: `src/app/admin/(protected)/vans/_components/VanForm.tsx`

- [ ] **Step 1 : Ajouter l'état pour les suggestions IA**

Après la ligne `const [uploadingGallery, setUploadingGallery] = useState(false);` (ligne 84 exacte), ajouter :

```typescript
  // Suggestions IA
  const [mainImageAiHint, setMainImageAiHint] = useState(false);
  const [galleryAiKeys, setGalleryAiKeys] = useState<Set<string>>(new Set());
```

- [ ] **Step 2 : Mettre à jour `uploadImage()` pour passer le contexte et retourner les métadonnées IA**

Remplacer la fonction `uploadImage` (lignes ~101-110) par :

```typescript
  async function uploadImage(
    file: File,
    opts: { vanName?: string } = {}
  ): Promise<{ ref: string; url: string; aiAlt?: string; aiCaption?: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name.replace(/\.[^/.]+$/, ""));
    fd.append("category", "vans");
    fd.append("imageRole", "gallery"); // toutes les photos vans sont en 3:2
    if (opts.vanName) fd.append("vanName", opts.vanName);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.assetId
      ? { ref: data.assetId, url: data.url, aiAlt: data.aiAlt, aiCaption: data.aiCaption }
      : null;
  }
```

- [ ] **Step 3 : Mettre à jour `handleMainImage` pour pré-remplir l'alt**

Remplacer `handleMainImage` (lignes 112-119 exactes) par :

```typescript
  async function handleMainImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    // van?.name pour les vans existants ; DOM fallback pour les nouveaux vans non encore sauvegardés
    const vanNameVal = van?.name ?? (document.querySelector<HTMLInputElement>('input[name="name"]'))?.value;
    const result = await uploadImage(file, { vanName: vanNameVal });
    setUploadingMain(false);
    if (result) {
      setMainImageRef(result.ref);
      setMainImageUrl(result.url);
      if (result.aiAlt && !mainImageAlt) {
        setMainImageAlt(result.aiAlt);
        setMainImageAiHint(true);
      }
      setMediaRefreshTrigger(t => t + 1);
    }
  }
```

- [ ] **Step 4 : Mettre à jour `handleGalleryUpload` pour pré-remplir les alts**

Remplacer `handleGalleryUpload` (lignes ~121-138) par :

```typescript
  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingGallery(true);
    const vanNameVal = van?.name ?? (document.querySelector<HTMLInputElement>('input[name="name"]'))?.value;
    for (const file of files) {
      const result = await uploadImage(file, { vanName: vanNameVal });
      if (result) {
        const key = `g${Date.now()}${Math.random()}`;
        setGallery(prev => [...prev, {
          _key: key,
          ref: result.ref,
          url: result.url,
          alt: result.aiAlt ?? "",
        }]);
        if (result.aiAlt) {
          setGalleryAiKeys(prev => new Set(prev).add(key));
        }
        setMediaRefreshTrigger(t => t + 1);
      }
    }
    setUploadingGallery(false);
  }
```

- [ ] **Step 5 : Ajouter le badge IA sur le champ alt de l'image principale**

Dans la section Photos du formulaire, trouver le champ `mainImageAlt`. Il ressemble à :
```tsx
<input value={mainImageAlt} onChange={e => setMainImageAlt(e.target.value)} ... />
```

Wrapper ce champ avec un indicateur IA :

```tsx
<div className="relative">
  <input
    value={mainImageAlt}
    onChange={e => { setMainImageAlt(e.target.value); setMainImageAiHint(false); }}
    className={inputCls}
    placeholder="Description de l'image pour le SEO"
  />
  {mainImageAiHint && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium pointer-events-none">
      ✨ IA
    </span>
  )}
</div>
```

- [ ] **Step 6 : Ajouter le badge IA sur les cards de galerie**

L'alt de galerie est rendu comme un input overlay en bas de l'image (position absolute), pas comme un champ standalone. Le badge ne peut pas être positionné dans cet input.

Trouver le conteneur de chaque item galerie (ligne 282) :
```tsx
<div key={item._key} className="relative group">
```

Ajouter le badge IA comme un badge top-left absolu, en dessous de `<img .../>` et avant l'input overlay :

```tsx
<div key={item._key} className="relative group">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={`${item.url}?w=200&h=150&fit=crop&auto=format`} alt={item.alt} className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200" />
  {/* Badge IA — disparaît quand l'utilisateur modifie la légende */}
  {galleryAiKeys.has(item._key) && (
    <span className="absolute top-1 left-1 text-xs bg-violet-600/90 text-white px-1.5 py-0.5 rounded-full font-medium pointer-events-none">
      ✨ IA
    </span>
  )}
  <input
    value={item.alt}
    onChange={e => {
      updateGalleryAlt(item._key, e.target.value);
      setGalleryAiKeys(prev => { const s = new Set(prev); s.delete(item._key); return s; });
    }}
    className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-xl placeholder-white/60 focus:outline-none"
    placeholder="Légende..."
  />
  <button type="button" onClick={() => removeGalleryItem(item._key)}
    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center hover:bg-red-600">✕</button>
</div>
```

Note : remplacer l'ensemble du bloc `<div key={item._key} ...>` existant (lignes 282–290) par ce nouveau bloc.

- [ ] **Step 7 : Build de vérification**

```bash
npm run build 2>&1 | grep -E "error TS|Error|✓" | head -10
```

Expected : `✓ Compiled successfully`

- [ ] **Step 8 : Commit**

```bash
git add src/app/admin/(protected)/vans/_components/VanForm.tsx
git commit -m "feat(admin): pre-fill van photo alt text with Gemini AI suggestions"
```

---

## Chunk 3 : ISR revalidation + deploy hook

### Task 5 : Fix ISR pour les pages individuelles des vans

**Files:**
- Modify: `src/app/api/revalidate/route.ts`

Actuellement, quand un van est mis à jour, la route revalide `/location` (la liste) mais pas `/location/yoni` ou `/location/xalbat`. Ce fix ajoute la revalidation des pages individuelles et un appel optionnel à un Vercel deploy hook.

- [ ] **Step 1 : Remplacer le contenu de `route.ts`**

```typescript
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body?._type as string | undefined;

    switch (type) {
      case "van":
        revalidatePath("/location", "layout");  // revalide /location/* (toutes les pages vans)
        revalidatePath("/achat");
        revalidatePath("/");
        break;
      case "testimonial":
        revalidatePath("/");
        break;
      case "spotPaysBasque":
        revalidatePath("/pays-basque");
        break;
      default:
        revalidatePath("/");
    }

    // ── Vercel deploy hook optionnel (pour rebuild complet si besoin) ──
    const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (deployHook && type === "van") {
      fetch(deployHook, { method: "POST" }).catch(err =>
        console.warn("[revalidate] deploy hook failed:", err)
      );
    }

    return NextResponse.json({
      revalidated: true,
      type: type ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2 : Ajouter `VERCEL_DEPLOY_HOOK_URL` dans `.env.local` (optionnel)**

Dans `.env.local`, ajouter en bas :
```
# Vercel deploy hook (optionnel — ISR suffit en général)
# VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
```

Pour activer : décommenter et coller l'URL depuis le dashboard Vercel → Project → Settings → Git → Deploy Hooks.

- [ ] **Step 3 : Build de vérification**

```bash
npm run build 2>&1 | grep -E "error|Error|✓" | head -5
```

Expected : `✓ Compiled successfully`

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/revalidate/route.ts
git commit -m "fix(revalidate): revalidate all van pages on Sanity update + optional deploy hook"
```

Note : ne pas committer `.env.local` — il contient des secrets réels et est dans `.gitignore`. L'ajout de `VERCEL_DEPLOY_HOOK_URL` est une modification locale uniquement.

---

## Notes d'intégration

### Variables d'environnement requises

| Variable | Statut | Usage |
|---|---|---|
| `GEMINI_API_KEY` | ✅ déjà configuré | Analyse Gemini Vision |
| `SANITY_API_WRITE_TOKEN` | ✅ déjà configuré | Upload Sanity |
| `SANITY_WEBHOOK_SECRET` | ✅ déjà configuré | ISR revalidation |
| `VERCEL_DEPLOY_HOOK_URL` | ➕ optionnel | Deploy hook Vercel |

### Flux complet

```
Admin uploade photo
  → Sharp : recadrage 3:2 WebP 1200×800
  → Gemini Flash : analyse → { alt, caption, filename }
  → Sanity : upload asset + mediaAsset avec alt IA
  → VanForm : champ alt pré-rempli avec badge ✨ IA
  → Admin sauvegarde le van
  → Sanity webhook → /api/revalidate
  → Next.js ISR : revalidatePath("/location", "layout") → pages visibles en <5s
```

### Fallback Gemini

Si `GEMINI_API_KEY` est absent ou si Gemini échoue, `analyzeVanImage()` retourne des valeurs par défaut génériques basées sur le nom du van. L'upload ne fail jamais à cause de l'analyse IA.
