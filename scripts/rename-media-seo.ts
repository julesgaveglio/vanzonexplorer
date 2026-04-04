// scripts/rename-media-seo.ts
// Scanne la médiathèque Sanity, détecte les noms non-SEO,
// analyse chaque image avec Gemini Vision et renomme intelligemment

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@sanity/client'
import { createCostTracker } from './lib/ai-costs'
import { startRun, finishRun } from './lib/agent-runs'
import { slugify } from '../src/lib/slugify'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ── Clients ───────────────────────────────────────────────────────────────────
const sanity = createClient({
  projectId: 'lewexa74',
  dataset: 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// ── Types ─────────────────────────────────────────────────────────────────────
interface MediaAsset {
  _id: string
  title: string
  category: string
  alt: string
  tags?: string[]
  url: string
}

// ── Détection mauvais noms SEO ────────────────────────────────────────────────
function isBadSeoName(asset: MediaAsset): boolean {
  const t = (asset.title ?? '').toLowerCase()
  const alt = asset.alt ?? ''

  if (!t || t.length < 3) return true

  // Raw filenames
  if (/^(img|dsc|dscn|photo|image|screenshot|capture|pic|picture|file)[-_\s\d]/i.test(asset.title)) return true
  if (/^img_\d/i.test(asset.title)) return true

  // Alt identique au titre (lazy copy)
  const altNorm = alt.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
  const titleNorm = t.replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (altNorm === titleNorm) return true

  // Alt trop court ou manquant
  if (!alt || alt.length < 15) return true

  // Titres génériques sans valeur SEO
  const badPatterns = [
    /^vanzon-explorer---location/,
    /^fenetre-\d/,
    /^ordinateur$/,
    /^favicone/,
    /^pays-basque-image-vanzon$/,
    /^van-ame-nage/,
    /^mockup-de-pesentation/,
    /^formation-vanlife-van-business-academy-vanzon-explorer$/,
    /^jules-gaveglio-et-elio-dubernet-brainstorming$/,
  ]
  if (badPatterns.some(p => p.test(t))) return true

  return false
}


// ── Analyse Gemini Vision (direct HTTP) ──────────────────────────────────────
async function analyzeWithGemini(asset: MediaAsset): Promise<{ title: string; alt: string; tags: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  // Fetch image as base64
  const imageUrl = asset.url + '?w=800&auto=format&q=80'
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Cannot fetch image: ${imageUrl}`)
  const buffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const rawMime = imgRes.headers.get('content-type') ?? 'image/jpeg'
  const mimeType = rawMime.split(';')[0]

  const categoryContext: Record<string, string> = {
    'van-yoni': 'van aménagé nommé Yoni, location van Pays Basque, Vanzon Explorer',
    'van-xalbat': 'van aménagé nommé Xalbat, location van Pays Basque, Vanzon Explorer',
    'pays-basque': 'paysage ou lieu du Pays Basque, destination road trip van',
    'formation': 'formation van aménagé, Van Business Academy, Vanzon Explorer',
    'equipe': 'équipe Vanzon Explorer, van life entrepreneur',
    'divers': 'van aménagé, road trip, Vanzon Explorer location van Pays Basque',
  }
  const ctx = categoryContext[asset.category] ?? categoryContext['divers']

  const prompt = `Tu es un expert SEO spécialisé dans les sites de location de vans aménagés.
Contexte : cette image appartient à la catégorie "${asset.category}" pour le site Vanzon Explorer (location van aménagé au Pays Basque).
Contexte catégorie : ${ctx}

Analyse l'image et génère :
1. Un "title" (nom de fichier SEO) : kebab-case, 4-8 mots descriptifs, inclure des mots-clés pertinents parmi : van, van-amenage, location, pays-basque, road-trip, vanzon, surf, montagne, ocean, formation, interieur, exterieur. PAS de stopwords ("de", "le", "la", "et"). Max 70 caractères.
2. Un "alt" : phrase descriptive en français, 50-120 caractères, décrit précisément ce qu'on voit, inclure "van aménagé" ou "Vanzon Explorer" si pertinent, ne pas commencer par "Image de" ou "Photo de".
3. Des "tags" : array de 3-5 mots-clés courts pertinents en français.

Réponds UNIQUEMENT avec du JSON valide sans markdown :
{"title": "...", "alt": "...", "tags": ["...", "..."]}`

  const apiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64 } },
          ]
        }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.3, responseMimeType: 'application/json' },
      }),
    }
  )

  if (!apiRes.ok) {
    const errText = await apiRes.text()
    throw new Error(`Gemini API error ${apiRes.status}: ${errText.slice(0, 200)}`)
  }

  const json = await apiRes.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!raw) throw new Error('Gemini returned empty response')

  // Multi-strategy JSON extraction
  let parsed: { title: string; alt: string; tags: string[] } | null = null
  // Strategy 1: direct parse
  try { parsed = JSON.parse(raw.trim()) } catch { /* next */ }
  // Strategy 2: strip markdown fences
  if (!parsed) {
    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      parsed = JSON.parse(stripped)
    } catch { /* next */ }
  }
  // Strategy 3: extract first {…} block
  if (!parsed) {
    const match = raw.match(/\{[\s\S]*?\}(?=\s*$|\s*```)/s) ?? raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch { /* next */ }
    }
  }
  if (!parsed) throw new Error(`Cannot parse JSON from response: ${raw.slice(0, 150)}`)

  return {
    title: slugify(parsed.title),
    alt: parsed.alt.slice(0, 150),
    tags: (parsed.tags ?? []).slice(0, 5),
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const costs = createCostTracker()
  const runId = await startRun('media-seo-rename', { description: 'Renommage SEO médiathèque Sanity via Gemini Vision' })

  console.log('🔍 Scan de la médiathèque Sanity...\n')

  const assets: MediaAsset[] = await sanity.fetch(`
    *[_type == "mediaAsset"] | order(category asc, title asc) {
      _id, title, category,
      "alt": image.alt,
      "tags": tags,
      "url": image.asset->url
    }
  `)

  console.log(`📦 Total assets : ${assets.length}`)

  const toRename = assets.filter(a => isBadSeoName(a) && a.url)
  const alreadyGood = assets.length - toRename.length - assets.filter(a => !a.url).length

  console.log(`✅ Déjà bien nommés : ${alreadyGood}`)
  console.log(`❌ À renommer : ${toRename.length}\n`)

  if (toRename.length === 0) {
    console.log('Rien à faire !')
    return
  }

  // Deduplicate by URL (avoid re-processing same image multiple times)
  const seen = new Set<string>()
  const uniqueToRename: MediaAsset[] = []
  const duplicateIds: string[] = []

  for (const asset of toRename) {
    const urlKey = asset.url.split('/').pop()?.split('-')[0] ?? asset.url
    if (seen.has(urlKey)) {
      duplicateIds.push(asset._id)
    } else {
      seen.add(urlKey)
      uniqueToRename.push(asset)
    }
  }

  console.log(`🔄 Uniques à analyser : ${uniqueToRename.length}`)
  if (duplicateIds.length > 0) console.log(`♻️  Doublons (même image, même fix) : ${duplicateIds.length}\n`)

  // Process each unique asset
  const results: Array<{ id: string; oldTitle: string; newTitle: string; newAlt: string; newTags: string[] }> = []

  for (let i = 0; i < uniqueToRename.length; i++) {
    const asset = uniqueToRename[i]
    process.stdout.write(`[${i + 1}/${uniqueToRename.length}] [${asset.category}] "${asset.title}" → analyse... `)

    try {
      const { title, alt, tags } = await analyzeWithGemini(asset)
      process.stdout.write(`"${title}" ✓\n`)
      results.push({ id: asset._id, oldTitle: asset.title, newTitle: title, newAlt: alt, newTags: tags })

      // Estimate tokens: ~1200 input (image ~800 + prompt ~400) + ~200 output
      costs.addGemini(1200, 200, 1, 'gemini-2.5-flash')

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 400))
    } catch (err) {
      console.error(`\n  ⚠️  Erreur : ${(err as Error).message}`)
    }
  }

  // Apply updates to Sanity
  console.log(`\n📝 Application des ${results.length} modifications dans Sanity...\n`)

  for (const r of results) {
    try {
      await sanity.patch(r.id).set({
        title: r.newTitle,
        'image.alt': r.newAlt,
        tags: r.newTags,
      }).commit()

      console.log(`  ✅ ${r.oldTitle}`)
      console.log(`     → title : "${r.newTitle}"`)
      console.log(`     → alt   : "${r.newAlt}"`)
      console.log(`     → tags  : [${r.newTags.join(', ')}]\n`)
    } catch (err) {
      console.error(`  ❌ Erreur patch ${r.id}: ${(err as Error).message}`)
    }
  }

  // Handle duplicates — apply same fix as their original
  if (duplicateIds.length > 0) {
    console.log(`\n♻️  Traitement des doublons (même URL → même nom)...`)
    for (const dupId of duplicateIds) {
      const dup = toRename.find(a => a._id === dupId)!
      // Find the result for this URL
      const urlKey = dup.url.split('/').pop()?.split('-')[0] ?? ''
      const match = results.find(r => {
        const orig = uniqueToRename.find(u => u._id === r.id)
        return orig && (orig.url.split('/').pop()?.split('-')[0] ?? '') === urlKey
      })
      if (match) {
        try {
          await sanity.patch(dupId).set({
            title: match.newTitle,
            'image.alt': match.newAlt,
            tags: match.newTags,
          }).commit()
          console.log(`  ✅ Doublon ${dupId.slice(0, 8)}... → "${match.newTitle}"`)
        } catch (err) {
          console.error(`  ❌ Doublon ${dupId}: ${(err as Error).message}`)
        }
      }
    }
  }

  const totalUpdated = results.length + duplicateIds.length
  console.log(`\n🎉 Renommage terminé ! ${totalUpdated} assets mis à jour.`)

  // Log costs to Supabase
  const costResult = costs.toRunResult()
  await finishRun(runId, {
    status: 'success',
    itemsProcessed: uniqueToRename.length,
    itemsCreated: totalUpdated,
    ...costResult,
    metadata: {
      description: 'Renommage SEO médiathèque Sanity',
      assetsAnalyzed: uniqueToRename.length,
      assetsUpdated: totalUpdated,
      model: 'gemini-2.5-flash',
    },
  })
  console.log(`💰 Coût Gemini Vision : €${costResult.costEur.toFixed(5)} (${costResult.tokensInput} tokens input, ${costResult.tokensOutput} output)`)
}

main().catch(console.error)
