// scripts/resend-last-roadtrip.ts
// Renvoie le dernier road trip envoyé à un email donné avec le template mis à jour

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { buildRoadTripEmail } from '../src/emails/road-trip'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  const targetEmail = process.argv[2] ?? 'gavegliojules@gmail.com'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY!)

  // Fetch last successful road trip
  const { data: rt, error } = await supabase
    .from('road_trip_requests')
    .select('id, prenom, email, region, duree, itineraire_json')
    .eq('email', targetEmail)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !rt) {
    console.error('❌ Aucun road trip trouvé pour', targetEmail, error)
    process.exit(1)
  }

  console.log(`✅ Road trip trouvé : ${rt.prenom} · ${rt.region} · ${rt.duree}j`)

  const emailEncoded = encodeURIComponent(rt.email)
  const { subject, html } = buildRoadTripEmail({
    prenom: rt.prenom,
    region: rt.region,
    duree: rt.duree,
    itineraire: rt.itineraire_json,
    emailEncoded,
  })

  const { error: resendError } = await resend.emails.send({
    from: 'Vanzon Explorer <noreply@vanzonexplorer.com>',
    to: rt.email,
    subject: `[RESEND] ${subject}`,
    html,
  })

  if (resendError) {
    console.error('❌ Erreur Resend:', resendError)
    process.exit(1)
  }

  console.log(`📬 Email renvoyé à ${rt.email} — sujet : ${subject}`)
}

main()
