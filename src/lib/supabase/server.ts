import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec service_role — usage SERVEUR UNIQUEMENT.
 * Bypasse le RLS. Ne jamais exposer côté client.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Client Supabase avec anon key — usage client ou serveur read-only.
 */
export function createSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
