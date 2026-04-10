// src/app/api/admin/poi/[id]/route.ts
// PATCH : update partiel d'un POI
// DELETE : suppression d'un POI

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { POIUpdate } from '@/types/poi'

// Whitelist des champs modifiables (évite qu'un client malicieux touche à id/scraped_at)
const EDITABLE_FIELDS: (keyof POIUpdate)[] = [
  'name',
  'category',
  'subcategory',
  'budget_level',
  'location_city',
  'address',
  'google_maps_url',
  'external_url',
  'image_url',
  'rating',
  'description',
  'tags',
  'parking_nearby',
  'parking_info',
  'overnight_allowed',
  'overnight_type',
  'overnight_price_per_night',
  'overnight_capacity',
  'overnight_amenities',
  'overnight_restrictions',
  'overnight_coordinates',
  'price_indication',
  'opening_hours',
  'duration_minutes',
]

function sanitizeUpdate(body: Record<string, unknown>): POIUpdate {
  const clean: POIUpdate = {}
  for (const field of EDITABLE_FIELDS) {
    if (field in body) {
      ;(clean as Record<string, unknown>)[field] = body[field]
    }
  }
  return clean
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const update = sanitizeUpdate(body)
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, poi: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const id = params.id
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('poi_cache').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
