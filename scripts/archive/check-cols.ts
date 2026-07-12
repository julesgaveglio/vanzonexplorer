import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data, error } = await sb.from('road_trip_requests').select('id, region_slug, article_sanity_id, quality_score').limit(1);
  if (error) console.error('MISSING COLUMNS:', error.message);
  else console.log('COLUMNS OK, found', data?.length, 'rows');
}
main();
