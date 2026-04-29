# VBA Sous-titres & Chapitres — Plan d'implémentation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pipeline automatique qui transcrit les vidéos VBA via Groq Whisper, upload les sous-titres sur Bunny.net (CC natif), et genere des chapitres IA affiches sous la video avec seek cliquable.

**Architecture:** Bouton admin par lecon → API route SSE → Groq Whisper transcription → SRT upload Bunny Captions API → Groq LLM chapitrage → stockage Supabase → composant VBAChapters client-side avec postMessage seek.

**Tech Stack:** Next.js 14 App Router, Groq SDK (Whisper + LLM), Bunny.net Stream API, Supabase, SSE streaming.

**Spec:** `docs/superpowers/specs/2026-04-25-vba-subtitles-chapters-design.md`

---

## Chunk 1: Schema + Pipeline backend

### Task 1: Migration Supabase

**Files:**
- Create: `supabase/migrations/20260425000001_vba_captions.sql`

- [ ] **Step 1: Ecrire la migration**

```sql
-- Add transcript and chapters columns to vba_lessons
ALTER TABLE vba_lessons ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE vba_lessons ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;
```

- [ ] **Step 2: Appliquer la migration**

Run: `npx supabase db push` ou appliquer manuellement dans le dashboard Supabase.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260425000001_vba_captions.sql
git commit -m "feat(vba): add transcript and chapters columns to vba_lessons"
```

---

### Task 2: Module de transcription Whisper + generation SRT

**Files:**
- Create: `src/lib/vba/transcribe.ts`

Ce module fait 3 choses :
1. Telecharge la video depuis Bunny
2. Envoie a Groq Whisper → recoit segments avec timestamps
3. Genere un fichier SRT depuis les segments

- [ ] **Step 1: Creer `src/lib/vba/transcribe.ts`**

```typescript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  srt: string;
}

/**
 * Download video from Bunny CDN and transcribe via Groq Whisper.
 */
export async function transcribeVideo(
  libraryId: string,
  videoId: string
): Promise<TranscriptionResult> {
  // 1. Get video download URL from Bunny API
  const bunnyRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    { headers: { AccessKey: process.env.BUNNY_API_KEY! } }
  );
  if (!bunnyRes.ok) throw new Error(`Bunny API error: ${bunnyRes.status}`);
  const videoInfo = await bunnyRes.json();

  // Bunny direct MP4 URL
  const pullZone = videoInfo.pullZone || "";
  const mp4Url = `https://${pullZone}.b-cdn.net/${videoId}/original`;

  // 2. Download the video file
  const videoRes = await fetch(mp4Url);
  if (!videoRes.ok) throw new Error(`Video download failed: ${videoRes.status}`);
  const videoBuffer = await videoRes.arrayBuffer();
  const videoFile = new File([videoBuffer], "video.mp4", { type: "video/mp4" });

  // 3. Send to Groq Whisper
  const transcription = await groq.audio.transcriptions.create({
    file: videoFile,
    model: "whisper-large-v3-turbo",
    language: "fr",
    response_format: "verbose_json",
  });

  // 4. Extract segments
  const segments: TranscriptSegment[] = (
    (transcription as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments ?? []
  ).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  // 5. Generate SRT
  const srt = generateSRT(segments);

  return {
    fullText: transcription.text,
    segments,
    srt,
  };
}

/**
 * Convert segments to SRT subtitle format.
 */
function generateSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSRTTime(seg.start);
      const end = formatSRTTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, "0")}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Upload SRT captions to Bunny.net via their Captions API.
 */
export async function uploadCaptionsToBunny(
  libraryId: string,
  videoId: string,
  srt: string
): Promise<void> {
  const captionsBody = {
    srclang: "fr",
    label: "Français",
    captionsFile: Buffer.from(srt).toString("base64"),
  };

  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/captions/fr`,
    {
      method: "POST",
      headers: {
        AccessKey: process.env.BUNNY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(captionsBody),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bunny captions upload failed: ${res.status} — ${body}`);
  }
}
```

- [ ] **Step 2: Verifier que le fichier compile**

Run: `npx tsc --noEmit src/lib/vba/transcribe.ts` (ou `npm run build` global — les erreurs de type remonteront)

- [ ] **Step 3: Commit**

```bash
git add src/lib/vba/transcribe.ts
git commit -m "feat(vba): add Whisper transcription + SRT generation + Bunny upload"
```

---

### Task 3: Module de chapitrage IA

**Files:**
- Create: `src/lib/vba/generate-chapters.ts`

- [ ] **Step 1: Creer `src/lib/vba/generate-chapters.ts`**

```typescript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface Chapter {
  title: string;
  time: number; // seconds
}

const SYSTEM_PROMPT = `Tu es un editeur video professionnel. A partir de cette transcription d'une video de formation sur le van amenage, identifie les changements de sujet majeurs et genere des chapitres.

Regles :
- Maximum 8 chapitres par video
- Minimum 2 minutes entre chaque chapitre
- Titres courts (3-6 mots), clairs, professionnels
- Le premier chapitre commence toujours a 0 secondes
- Ignore les digressions, blagues, hesitations — ne garde que les vrais changements de sujet
- Reponds UNIQUEMENT en JSON valide : [{"title":"...","time":0},...]`;

export async function generateChapters(
  transcript: string,
  segments: Array<{ start: number; end: number; text: string }>
): Promise<Chapter[]> {
  // Build a timestamped transcript for the LLM
  const timestamped = segments
    .map((s) => `[${formatTime(s.start)}] ${s.text}`)
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: timestamped },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    // Handle both {chapters:[...]} and direct [...] formats
    const chapters: Chapter[] = Array.isArray(parsed)
      ? parsed
      : parsed.chapters ?? [];

    // Validate and sort
    return chapters
      .filter(
        (c: Chapter) =>
          typeof c.title === "string" &&
          typeof c.time === "number" &&
          c.time >= 0
      )
      .sort((a: Chapter, b: Chapter) => a.time - b.time);
  } catch {
    return [{ title: "Introduction", time: 0 }];
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/vba/generate-chapters.ts
git commit -m "feat(vba): add AI chapter generation from transcript"
```

---

### Task 4: API route SSE generate-captions

**Files:**
- Create: `src/app/api/admin/vba/generate-captions/route.ts`
- Reference: `src/lib/sse.ts` (createSSEResponse helper existant)
- Reference: `src/lib/auth.ts` (requireAdmin helper existant)

- [ ] **Step 1: Creer la route API**

```typescript
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSSEResponse } from "@/lib/sse";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { transcribeVideo, uploadCaptionsToBunny } from "@/lib/vba/transcribe";
import { generateChapters } from "@/lib/vba/generate-chapters";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("status" in authResult) return authResult;

  const { lessonId } = await req.json();
  if (!lessonId) {
    return new Response(JSON.stringify({ error: "lessonId required" }), {
      status: 400,
    });
  }

  return createSSEResponse(async (send) => {
    const supabase = createSupabaseAdmin();

    // 1. Fetch lesson info
    send({ type: "progress", step: "fetching", message: "Récupération de la leçon..." });
    const { data: lesson, error } = await supabase
      .from("vba_lessons")
      .select("id, bunny_video_id, bunny_library_id, title")
      .eq("id", lessonId)
      .single();

    if (error || !lesson) throw new Error("Leçon introuvable");
    if (!lesson.bunny_video_id) throw new Error("Pas de vidéo Bunny configurée");

    const libraryId =
      lesson.bunny_library_id || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "";
    if (!libraryId) throw new Error("Library ID Bunny manquant");

    // 2. Transcribe
    send({ type: "progress", step: "transcribing", message: "Transcription en cours (Whisper)..." });
    const result = await transcribeVideo(libraryId, lesson.bunny_video_id);

    // 3. Upload captions to Bunny
    send({ type: "progress", step: "uploading_captions", message: "Upload des sous-titres sur Bunny..." });
    await uploadCaptionsToBunny(libraryId, lesson.bunny_video_id, result.srt);

    // 4. Generate chapters
    send({ type: "progress", step: "generating_chapters", message: "Génération des chapitres IA..." });
    const chapters = await generateChapters(result.fullText, result.segments);

    // 5. Save to Supabase
    send({ type: "progress", step: "saving", message: "Sauvegarde..." });
    const { error: updateError } = await supabase
      .from("vba_lessons")
      .update({
        transcript: result.fullText,
        chapters,
      })
      .eq("id", lessonId);

    if (updateError) throw new Error(`Erreur sauvegarde: ${updateError.message}`);

    send({
      type: "done",
      message: "Sous-titres et chapitres générés !",
      chaptersCount: chapters.length,
    });
  });
}
```

- [ ] **Step 2: Verifier build**

Run: `npm run build 2>&1 | grep -i error | head -10`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/vba/generate-captions/route.ts
git commit -m "feat(vba): add SSE API route for caption generation pipeline"
```

---

## Chunk 2: Composant chapitres frontend

### Task 5: Composant VBAChapters

**Files:**
- Create: `src/app/(site)/dashboard/vba/_components/VBAChapters.tsx`

Ce composant affiche les chapitres sous la video. Au clic, il seek dans le player Bunny via postMessage.

- [ ] **Step 1: Creer le composant**

```tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Clock } from "lucide-react";

interface Chapter {
  title: string;
  time: number;
}

interface VBAChaptersProps {
  chapters: Chapter[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VBAChapters({ chapters, iframeRef }: VBAChaptersProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen to Bunny player time updates to highlight active chapter
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Bunny player sends time updates
      if (event.data?.event === "timeupdate" && typeof event.data.data === "number") {
        const currentTime = event.data.data;
        // Find the active chapter
        let idx = 0;
        for (let i = chapters.length - 1; i >= 0; i--) {
          if (currentTime >= chapters[i].time) {
            idx = i;
            break;
          }
        }
        setActiveIndex(idx);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [chapters]);

  const seekTo = useCallback(
    (time: number, index: number) => {
      if (!iframeRef.current?.contentWindow) return;
      iframeRef.current.contentWindow.postMessage(
        { event: "seek", data: time },
        "*"
      );
      setActiveIndex(index);
    },
    [iframeRef]
  );

  if (chapters.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Chapitres
        </span>
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {chapters.map((chapter, i) => (
          <button
            key={i}
            onClick={() => seekTo(chapter.time, i)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              i === activeIndex
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="text-xs font-mono opacity-70">
              {formatTime(chapter.time)}
            </span>
            <span className="font-medium">{chapter.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(site)/dashboard/vba/_components/VBAChapters.tsx
git commit -m "feat(vba): add VBAChapters component with seek support"
```

---

### Task 6: Integrer les chapitres dans la page lecon

**Files:**
- Modify: `src/app/(site)/dashboard/vba/[moduleSlug]/[lessonSlug]/page.tsx`

Changements :
1. Ajouter `chapters` au select Supabase
2. Wrapper l'iframe dans un composant client pour passer un ref
3. Afficher VBAChapters sous la video
4. Ajouter `&captions=fr` a l'URL iframe pour activer les sous-titres par defaut

- [ ] **Step 1: Creer un wrapper client pour l'iframe**

Creer `src/app/(site)/dashboard/vba/_components/VBAVideoPlayer.tsx` :

```tsx
"use client";

import { useRef } from "react";
import VBAChapters from "./VBAChapters";

interface Chapter {
  title: string;
  time: number;
}

interface VBAVideoPlayerProps {
  libraryId: string;
  videoId: string;
  chapters: Chapter[];
}

export default function VBAVideoPlayer({
  libraryId,
  videoId,
  chapters,
}: VBAVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="mb-6">
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true&captions=fr`}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-xl border border-slate-200"
      />
      <VBAChapters chapters={chapters} iframeRef={iframeRef} />
    </div>
  );
}
```

- [ ] **Step 2: Modifier la page lecon**

Dans `src/app/(site)/dashboard/vba/[moduleSlug]/[lessonSlug]/page.tsx` :

**a) Ajouter `chapters` au select (ligne 53) :**
```diff
- .select("id, module_id, title, slug, bunny_video_id, bunny_library_id, duration_seconds, description, resources, order")
+ .select("id, module_id, title, slug, bunny_video_id, bunny_library_id, duration_seconds, description, resources, order, chapters")
```

**b) Ajouter l'import VBAVideoPlayer (apres les imports existants) :**
```typescript
import VBAVideoPlayer from "../../_components/VBAVideoPlayer";
```

**c) Parser les chapitres (apres `const resources = ...` ligne 107) :**
```typescript
const chapters = (currentLesson.chapters ?? []) as Array<{ title: string; time: number }>;
```

**d) Remplacer le bloc iframe (lignes 158-166) par :**
```tsx
<VBAVideoPlayer
  libraryId={libraryId}
  videoId={videoId}
  chapters={chapters}
/>
```

- [ ] **Step 3: Verifier build**

Run: `npm run build 2>&1 | grep -i error | head -10`
Expected: pas d'erreur

- [ ] **Step 4: Commit**

```bash
git add src/app/(site)/dashboard/vba/_components/VBAVideoPlayer.tsx src/app/(site)/dashboard/vba/[moduleSlug]/[lessonSlug]/page.tsx
git commit -m "feat(vba): integrate video player with chapters and captions=fr"
```

---

## Chunk 3: Bouton admin + integration API lessons

### Task 7: Ajouter le bouton "Generer sous-titres" dans l'admin

**Files:**
- Modify: `src/app/admin/(protected)/vba/[moduleId]/_components/VBALessonsClient.tsx`

Ajouter un bouton "CC" a cote de chaque lecon dans la liste (colonne Video). Le bouton declenche la generation via SSE et affiche la progression.

- [ ] **Step 1: Ajouter le state et la logique SSE**

En haut du composant `VBALessonsClient`, ajouter :

```typescript
const [captionLoading, setCaptionLoading] = useState<string | null>(null);
const [captionStatus, setCaptionStatus] = useState<string>("");

async function generateCaptions(lessonId: string) {
  if (!confirm("Générer les sous-titres et chapitres pour cette leçon ?")) return;
  setCaptionLoading(lessonId);
  setCaptionStatus("Démarrage...");

  try {
    const res = await fetch("/api/admin/vba/generate-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });

    if (!res.ok) throw new Error("Erreur API");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "progress") setCaptionStatus(data.message);
          if (data.type === "done") {
            setCaptionStatus(`Terminé — ${data.chaptersCount} chapitres`);
            // Update local lesson state to show badge
            setLessons((prev) =>
              prev.map((l) =>
                l.id === lessonId ? { ...l, transcript: "generated" } : l
              )
            );
          }
          if (data.type === "error") throw new Error(data.message);
        } catch { /* skip parse errors */ }
      }
    }
  } catch (err) {
    setCaptionStatus(`Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
  } finally {
    setTimeout(() => {
      setCaptionLoading(null);
      setCaptionStatus("");
    }, 3000);
  }
}
```

- [ ] **Step 2: Ajouter le type `transcript` a l'interface Lesson**

```diff
interface Lesson {
  // ... existing fields ...
+ transcript?: string | null;
}
```

- [ ] **Step 3: Ajouter le bouton dans la colonne Video du tableau**

Remplacer le contenu de la cellule Video (lignes 516-523) :

```tsx
<td className="px-5 py-3 text-center">
  <div className="flex items-center justify-center gap-1">
    {lesson.bunny_video_id ? (
      <>
        <span className="text-xs text-emerald-600 font-medium">OK</span>
        {(lesson as Lesson & { transcript?: string | null }).transcript ? (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">CC</span>
        ) : (
          <button
            onClick={() => generateCaptions(lesson.id)}
            disabled={captionLoading === lesson.id}
            className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
            title="Générer sous-titres & chapitres"
          >
            {captionLoading === lesson.id ? "..." : "CC"}
          </button>
        )}
      </>
    ) : (
      <span className="text-xs text-slate-400">—</span>
    )}
  </div>
  {captionLoading === lesson.id && (
    <p className="text-[10px] text-blue-500 mt-1 animate-pulse">{captionStatus}</p>
  )}
</td>
```

- [ ] **Step 4: Modifier l'API GET lessons pour inclure transcript (indicateur)**

Dans `src/app/api/admin/vba/lessons/route.ts`, ajouter `transcript` au select :

```diff
- .select("*")
+ .select("*, transcript")
```

Note : si le select est deja `*`, rien a changer — le champ sera inclus automatiquement apres la migration.

- [ ] **Step 5: Verifier build**

Run: `npm run build 2>&1 | grep -i error | head -10`

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/(protected)/vba/[moduleId]/_components/VBALessonsClient.tsx
git commit -m "feat(vba): add CC generation button in admin lessons list"
```

---

## Chunk 4: Verification finale

### Task 8: Test end-to-end et ajustements

- [ ] **Step 1: Verifier le build complet**

Run: `npm run build`
Expected: Build reussi sans erreurs

- [ ] **Step 2: Tester le flow admin**

1. Ouvrir `/admin/vba/[moduleId]` sur une lecon avec video Bunny
2. Cliquer "CC" → verifier SSE progression
3. Verifier que le badge "CC" apparait apres generation

- [ ] **Step 3: Tester le flow eleve**

1. Ouvrir `/dashboard/vba/[moduleSlug]/[lessonSlug]` sur la meme lecon
2. Verifier que les chapitres s'affichent sous la video
3. Verifier que le bouton CC apparait dans le player Bunny
4. Cliquer un chapitre → verifier le seek dans la video

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(vba): complete subtitle & chapter generation pipeline"
```
