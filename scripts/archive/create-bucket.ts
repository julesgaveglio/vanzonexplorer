import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data, error } = await sb.storage.createBucket('road-trip-images', { public: true });
  if (error && !error.message.includes('already exists')) console.error('Error:', error.message);
  else console.log('Bucket road-trip-images ready:', data || 'already exists');
}
main();
