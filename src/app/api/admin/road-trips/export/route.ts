// src/app/api/admin/road-trips/export/route.ts
// Export CSV de tous les leads road trip (filtrable par status/van_status/contacted)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'

interface LeadRow {
  id: string
  created_at: string
  sent_at: string | null
  status: string
  prenom: string | null
  lead_firstname: string | null
  email: string | null
  lead_email: string | null
  region: string | null
  duree: number | null
  interets: string[] | null
  van_status: string | null
  group_type: string | null
  profil_voyageur: string | null
  budget_level: string | null
  budget: string | null
  overnight_preference: string | null
  contacted: boolean | null
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get('status')
  const vanStatusFilter = url.searchParams.get('van_status')
  const contactedFilter = url.searchParams.get('contacted')

  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('road_trip_requests')
    .select(
      'id, created_at, sent_at, status, prenom, lead_firstname, email, lead_email, region, duree, interets, van_status, group_type, profil_voyageur, budget_level, budget, overnight_preference, contacted'
    )
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  if (vanStatusFilter && vanStatusFilter !== 'all') {
    query = query.eq('van_status', vanStatusFilter)
  }
  if (contactedFilter === 'true') {
    query = query.eq('contacted', true)
  } else if (contactedFilter === 'false') {
    query = query.eq('contacted', false)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data as LeadRow[] | null) ?? []

  const headers = [
    'id',
    'created_at',
    'sent_at',
    'status',
    'firstname',
    'email',
    'region',
    'duree',
    'interets',
    'van_status',
    'group_type',
    'budget_level',
    'overnight_preference',
    'contacted',
  ]

  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.created_at),
        csvEscape(r.sent_at ?? ''),
        csvEscape(r.status),
        csvEscape(r.lead_firstname ?? r.prenom ?? ''),
        csvEscape(r.lead_email ?? r.email ?? ''),
        csvEscape(r.region ?? ''),
        csvEscape(r.duree ?? ''),
        csvEscape((r.interets ?? []).join(';')),
        csvEscape(r.van_status ?? ''),
        csvEscape(r.group_type ?? r.profil_voyageur ?? ''),
        csvEscape(r.budget_level ?? r.budget ?? ''),
        csvEscape(r.overnight_preference ?? ''),
        csvEscape(r.contacted ? 'true' : 'false'),
      ].join(',')
    )
  }

  const csv = lines.join('\n')
  const timestamp = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="road-trips-leads-${timestamp}.csv"`,
    },
  })
}
