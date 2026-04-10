// src/app/api/admin/poi/list/route.ts
// Liste paginée des POI avec filtres + stats globales + cities distinctes

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { POICacheRow, POIListResponse } from '@/types/poi'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim() ?? ''
  const category = url.searchParams.get('category') ?? 'all'
  const budget = url.searchParams.get('budget') ?? 'all'
  const city = url.searchParams.get('city') ?? 'all'
  const overnightOnly = url.searchParams.get('overnight_only') === 'true'
  const sort = (url.searchParams.get('sort') ?? 'recent') as 'recent' | 'rating' | 'alpha'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const pageSize = Math.min(200, Math.max(10, Number(url.searchParams.get('page_size') ?? 50)))

  const supabase = createSupabaseAdmin()

  // ─── Query principale (paginée) ──────────────────────────────────────────
  let query = supabase.from('poi_cache').select('*', { count: 'exact' })

  if (search) {
    // OR sur name / description / location_city (ilike)
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%,location_city.ilike.%${search}%`
    )
  }
  if (category !== 'all') query = query.eq('category', category)
  if (budget !== 'all') query = query.eq('budget_level', budget)
  if (city !== 'all') query = query.eq('location_city', city)
  if (overnightOnly) query = query.eq('overnight_allowed', true)

  if (sort === 'alpha') query = query.order('name', { ascending: true })
  else if (sort === 'rating') query = query.order('rating', { ascending: false, nullsFirst: false })
  else query = query.order('scraped_at', { ascending: false })

  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data: rows, count, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ─── Stats globales (indépendantes des filtres) ─────────────────────────
  const [
    { count: total },
    { count: restaurantCount },
    { count: activiteCount },
    { count: spotNuitCount },
    { count: cultureCount },
    { count: natureCount },
    { count: parkingCount },
    { count: withImageCount },
    { count: addedThisMonth },
    { data: distinctCitiesRaw },
  ] = await Promise.all([
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'restaurant'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'activite'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'spot_nuit'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'culture'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'nature'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).eq('category', 'parking'),
    supabase.from('poi_cache').select('*', { count: 'exact', head: true }).not('image_url', 'is', null),
    supabase
      .from('poi_cache')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('poi_cache').select('location_city').limit(1000),
  ])

  const citiesSet = new Set<string>()
  for (const row of (distinctCitiesRaw as { location_city: string }[] | null) ?? []) {
    if (row.location_city) citiesSet.add(row.location_city)
  }
  const cities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, 'fr'))

  const totalSafe = total ?? 0
  const response: POIListResponse = {
    rows: (rows as POICacheRow[] | null) ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
    stats: {
      total: totalSafe,
      by_category: {
        restaurant: restaurantCount ?? 0,
        activite: activiteCount ?? 0,
        spot_nuit: spotNuitCount ?? 0,
        culture: cultureCount ?? 0,
        nature: natureCount ?? 0,
        parking: parkingCount ?? 0,
      },
      with_image: withImageCount ?? 0,
      without_image: totalSafe - (withImageCount ?? 0),
      added_this_month: addedThisMonth ?? 0,
    },
    cities,
  }

  return NextResponse.json(response)
}
