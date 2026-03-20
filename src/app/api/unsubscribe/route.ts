// src/app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.redirect(new URL('/unsubscribe?error=1', req.url))
  }

  const supabase = createSupabaseAdmin()
  await supabase
    .from('email_unsubscribes')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

  return NextResponse.redirect(new URL('/unsubscribe?success=1', req.url))
}
