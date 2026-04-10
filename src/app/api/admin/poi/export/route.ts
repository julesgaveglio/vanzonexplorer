// src/app/api/admin/poi/export/route.ts
// Export JSON ou CSV de la base poi_cache
// ?format=json|csv  + mêmes filtres que /list (search, category, budget, city, overnight_only)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { POICacheRow } from '@/types/poi'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = Array.isArray(value) ? value.join(';') : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const format = (url.searchParams.get('format') ?? 'json').toLowerCase()
  const search = url.searchParams.get('search')?.trim() ?? ''
  const category = url.searchParams.get('category') ?? 'all'
  const budget = url.searchParams.get('budget') ?? 'all'
  const city = url.searchParams.get('city') ?? 'all'
  const overnightOnly = url.searchParams.get('overnight_only') === 'true'

  const supabase = createSupabaseAdmin()
  let query = supabase.from('poi_cache').select('*').order('scraped_at', { ascending: false })

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,location_city.ilike.%${search}%`
    )
  }
  if (category !== 'all') query = query.eq('category', category)
  if (budget !== 'all') query = query.eq('budget_level', budget)
  if (city !== 'all') query = query.eq('location_city', city)
  if (overnightOnly) query = query.eq('overnight_allowed', true)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data as POICacheRow[] | null) ?? []
  const timestamp = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    const headers = [
      'id',
      'name',
      'category',
      'subcategory',
      'budget_level',
      'location_city',
      'address',
      'description',
      'tags',
      'rating',
      'external_url',
      'google_maps_url',
      'image_url',
      'overnight_allowed',
      'overnight_type',
      'overnight_price_per_night',
      'overnight_amenities',
      'overnight_restrictions',
      'price_indication',
      'opening_hours',
      'duration_minutes',
      'source',
      'scraped_at',
    ]

    const lines = [headers.join(',')]
    for (const r of rows) {
      lines.push(
        [
          csvEscape(r.id),
          csvEscape(r.name),
          csvEscape(r.category),
          csvEscape(r.subcategory),
          csvEscape(r.budget_level),
          csvEscape(r.location_city),
          csvEscape(r.address),
          csvEscape(r.description),
          csvEscape(r.tags),
          csvEscape(r.rating),
          csvEscape(r.external_url),
          csvEscape(r.google_maps_url),
          csvEscape(r.image_url),
          csvEscape(r.overnight_allowed),
          csvEscape(r.overnight_type),
          csvEscape(r.overnight_price_per_night),
          csvEscape(r.overnight_amenities),
          csvEscape(r.overnight_restrictions),
          csvEscape(r.price_indication),
          csvEscape(r.opening_hours),
          csvEscape(r.duration_minutes),
          csvEscape(r.source),
          csvEscape(r.scraped_at),
        ].join(',')
      )
    }

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="poi-cache-${timestamp}.csv"`,
      },
    })
  }

  // JSON (default)
  return new NextResponse(JSON.stringify(rows, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="poi-cache-${timestamp}.json"`,
    },
  })
}
