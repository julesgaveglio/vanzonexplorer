// src/app/api/admin/road-trips/toggle-contacted/route.ts
// Bascule le champ `contacted` d'un lead road trip (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { id?: string; contacted?: boolean }
  try {
    body = (await req.json()) as { id?: string; contacted?: boolean }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || typeof body.contacted !== 'boolean') {
    return NextResponse.json(
      { error: 'Missing id or contacted (boolean)' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('road_trip_requests')
    .update({ contacted: body.contacted })
    .eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
