import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  // Reset tous les article_pending → sent
  const { data, error } = await sb
    .from('road_trip_requests')
    .update({ status: 'sent' })
    .eq('status', 'article_pending')
    .select('id, region');
  if (error) console.error('Error:', error.message);
  else console.log('Reset', data?.length, 'rows:', data?.map(r => r.region));
  
  // Voir la Camargue
  const { data: camargue } = await sb
    .from('road_trip_requests')
    .select('id, status, region')
    .eq('region', 'Camargue')
    .single();
  console.log('Camargue:', camargue);
}
main();
