# VBA — Sous-titres automatiques & Chapitrage IA

## Objectif

Ajouter un pipeline automatique qui, en un clic dans l'admin, transcrit une vidéo VBA, upload les sous-titres sur Bunny.net (bouton CC natif dans le player), et genere des chapitres intelligents affiches sous la video avec seek cliquable.

## Contraintes

- **Cout minimal** : Groq Whisper (transcription) + Groq LLM llama-3.3-70b (chapitres) — ~0.03EUR/video
- **Zero changement de player** : on garde l'iframe Bunny.net, on utilise son CC natif
- **Sous-titres toggle** : le bouton CC de Bunny apparait automatiquement quand des captions sont uploadees
- **Chapitres** : composant custom sous la video, seek via postMessage au player Bunny

## Architecture

### Pipeline (declenche par bouton admin)

```
1. Admin clique "Generer sous-titres & chapitres" sur une lecon
2. API route SSE demarre :
   a. Recupere l'URL de telechargement video via Bunny API
   b. Telecharge l'audio (ou video entiere)
   c. Envoie a Groq Whisper (large-v3-turbo) → recoit segments + timestamps
   d. Genere un fichier SRT depuis les segments
   e. Upload SRT sur Bunny via Captions API (PUT /library/{libId}/videos/{vidId}/captions/fr)
   f. Envoie la transcription complete a Groq LLM → recoit chapitres (titre + timestamp)
   g. Sauvegarde transcript + chapters dans vba_lessons (Supabase)
   h. Retourne succes via SSE
```

### Schema DB (migration)

```sql
ALTER TABLE vba_lessons ADD COLUMN transcript TEXT;
ALTER TABLE vba_lessons ADD COLUMN chapters JSONB DEFAULT '[]'::jsonb;
```

Format chapters :
```json
[
  {"title": "Quel modele choisir", "time": 0},
  {"title": "Budget et kilometrage", "time": 145},
  {"title": "Ou chercher sur LeBoncoin", "time": 320}
]
```

### API Routes

**POST /api/admin/vba/generate-captions**
- Body : `{ lessonId: string }`
- Auth : requireAdmin()
- Response : SSE stream (progression etapes)
- Etapes streamees : downloading → transcribing → uploading_captions → generating_chapters → saving → done

### Composants

**VBAChapters (client component)**
- Recoit `chapters: {title: string, time: number}[]` et `iframeRef`
- Affiche liste horizontale scrollable sous la video
- Highlight du chapitre actif (polling position via postMessage)
- Clic → envoie `postMessage({event: 'seek', data: timeInSeconds})` au player Bunny

**Bouton admin "Generer sous-titres & chapitres"**
- Dans VBALessonsClient.tsx, a cote de chaque lecon avec bunny_video_id
- Desactive si pas de video ID
- Spinner + progression SSE pendant la generation
- Badge "CC" affiche si transcript existe deja

### Bunny.net API utilisees

1. **GET /library/{libId}/videos/{vidId}** → recuperer infos video + URL telechargement
2. **PUT /library/{libId}/videos/{vidId}/captions/{srclang}** → upload SRT
   - Header : `AccessKey: {BUNNY_API_KEY}`
   - Body : `{ srclang: "fr", label: "Francais", captionsFile: "<base64 SRT>" }`

### Groq API utilisees

1. **Whisper** : `POST /openai/v1/audio/transcriptions`
   - Model : `whisper-large-v3-turbo`
   - Response format : `verbose_json` (inclut segments avec timestamps)
   - Langue : `fr`

2. **LLM** : `POST /openai/v1/chat/completions`
   - Model : `llama-3.3-70b-versatile`
   - System prompt : extraire chapitres pertinents depuis une transcription
   - Output : JSON array de chapitres

### Prompt chapitrage

```
Tu es un editeur video professionnel. A partir de cette transcription d'une video de formation sur le van amenage, identifie les changements de sujet majeurs et genere des chapitres.

Regles :
- Maximum 8 chapitres par video
- Minimum 2 minutes entre chaque chapitre
- Titres courts (3-6 mots), clairs, professionnels
- Le premier chapitre commence toujours a 0 secondes
- Ignore les digressions, blagues, hesitations — ne garde que les vrais changements de sujet
- Reponds UNIQUEMENT en JSON : [{"title":"...","time":0},...]

Transcription :
{transcript}
```

### Env variables requises

```
BUNNY_API_KEY=xxx          # deja existant
NEXT_PUBLIC_BUNNY_LIBRARY_ID=xxx  # deja existant
GROQ_API_KEY=xxx           # deja existant
```

### Fichiers impactes

| Action | Fichier |
|--------|---------|
| Creer | `supabase/migrations/2026XXXX_vba_captions.sql` |
| Creer | `src/app/api/admin/vba/generate-captions/route.ts` |
| Creer | `src/lib/vba/transcribe.ts` (pipeline Whisper + SRT + Bunny upload) |
| Creer | `src/lib/vba/generate-chapters.ts` (LLM chapitrage) |
| Creer | `src/app/(site)/dashboard/vba/_components/VBAChapters.tsx` |
| Modifier | `src/app/(site)/dashboard/vba/[moduleSlug]/[lessonSlug]/page.tsx` (ajouter chapters + iframe ref) |
| Modifier | `src/app/admin/(protected)/vba/[moduleId]/_components/VBALessonsClient.tsx` (bouton generer) |
| Modifier | `src/app/api/admin/vba/lessons/route.ts` (inclure transcript/chapters dans GET) |
