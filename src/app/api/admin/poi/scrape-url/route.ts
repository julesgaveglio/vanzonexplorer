// src/app/api/admin/poi/scrape-url/route.ts
// Scrape une URL unique → Jina reader + OG image + Groq extraction → upsert poi_cache

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import {
  fetchJinaReader,
  extractOGImage,
  extractPOIFromText,
  sanitizePOI,
} from '@/lib/admin/poi-scraper'
import type { POICacheRow } from '@/types/poi'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { url?: string }
  try {
    body = (await req.json()) as { url?: string }
  } catch {
    return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { success: false, error: 'URL valide requise (http:// ou https://)' },
      { status: 400 }
    )
  }

  // 1. Jina reader (texte propre) et OG image en parallèle
  const [pageContent, imageUrl] = await Promise.all([
    fetchJinaReader(url),
    extractOGImage(url),
  ])

  if (!pageContent) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Impossible de lire le contenu de la page (Jina reader a échoué). Vérifiez l'URL.",
      },
      { status: 502 }
    )
  }

  // 2. Groq extraction structurée
  const extracted = await extractPOIFromText(pageContent, url)
  if (!extracted) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Aucun POI concret n'a pu être extrait de la page (pas de lieu identifiable).",
      },
      { status: 422 }
    )
  }

  // 3. Sanitize
  const payload = sanitizePOI(extracted, {
    image_url: imageUrl,
    source: 'manual',
    external_url: url,
  })
  if (!payload) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Les champs extraits sont incomplets (nom, ville ou catégorie manquants).",
      },
      { status: 422 }
    )
  }

  // 4. Upsert
  const supabase = createSupabaseAdmin()

  // Dedup check pour renvoyer un flag "duplicate" au front
  const { data: existing } = await supabase
    .from('poi_cache')
    .select('id')
    .eq('name', payload.name)
    .eq('location_city', payload.location_city)
    .maybeSingle()

  const { data, error } = await supabase
    .from('poi_cache')
    .upsert(payload, { onConflict: 'name,location_city' })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: `Erreur base de données : ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    poi: data as POICacheRow,
    duplicate: Boolean(existing),
  })
}
