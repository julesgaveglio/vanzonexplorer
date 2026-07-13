#!/usr/bin/env tsx
/**
 * migrate-clerk-users.ts
 *
 * Migration one-shot des utilisateurs Clerk : instance DEV → instance PRODUCTION.
 * - Recrée chaque utilisateur (email + nom) dans l'instance prod
 * - Re-lie le profil Supabase (profiles.clerk_id) au nouvel ID par email
 * - Les utilisateurs se connecteront via « mot de passe oublié » (ou code email)
 *
 * Usage :
 *   npx tsx scripts/migrate-clerk-users.ts            # dry-run (aucune écriture)
 *   npx tsx scripts/migrate-clerk-users.ts --apply    # exécution réelle
 *
 * Env requis (.env.local) :
 *   CLERK_SECRET_KEY        — sk_test_ (instance dev, source)
 *   CLERK_SECRET_KEY_LIVE   — sk_live_ (instance prod, destination)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const DEV_KEY = process.env.CLERK_SECRET_KEY!;
const LIVE_KEY = process.env.CLERK_SECRET_KEY_LIVE!;
const APPLY = process.argv.includes("--apply");

if (!DEV_KEY?.startsWith("sk_test_")) throw new Error("CLERK_SECRET_KEY doit être la clé sk_test_ (dev)");
if (!LIVE_KEY?.startsWith("sk_live_")) throw new Error("CLERK_SECRET_KEY_LIVE doit être la clé sk_live_ (prod)");

const mask = (email: string) => email.replace(/^(.{2})[^@]*@/, "$1***@");

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url?: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  primary_email_address_id: string | null;
}

async function clerkGet<T>(key: string, path: string): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Clerk GET ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function clerkPost<T>(key: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Clerk POST ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function main() {
  console.log(`🔁 Migration Clerk dev → prod ${APPLY ? "(APPLY)" : "(DRY-RUN)"}\n`);

  // 1. Utilisateurs de l'instance dev
  const devUsers = await clerkGet<ClerkUser[]>(DEV_KEY, "/users?limit=100&order_by=created_at");
  console.log(`Source (dev) : ${devUsers.length} utilisateur(s)`);

  // 2. Utilisateurs déjà présents dans l'instance prod (idempotence)
  const prodUsers = await clerkGet<ClerkUser[]>(LIVE_KEY, "/users?limit=100");
  const prodByEmail = new Map<string, string>();
  for (const u of prodUsers) {
    for (const e of u.email_addresses) prodByEmail.set(e.email_address.toLowerCase(), u.id);
  }
  console.log(`Destination (prod) : ${prodUsers.length} utilisateur(s) déjà présents\n`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let created = 0, skipped = 0, relinked = 0, errors = 0;

  for (const user of devUsers) {
    const primary = user.email_addresses.find((e) => e.id === user.primary_email_address_id)
      ?? user.email_addresses[0];
    if (!primary) {
      console.log(`  ⚠️  ${user.id} : aucun email — ignoré`);
      skipped++;
      continue;
    }
    const email = primary.email_address.toLowerCase();

    try {
      // Créer (ou retrouver) l'utilisateur en prod
      let prodId = prodByEmail.get(email);
      if (prodId) {
        console.log(`  = ${mask(email)} : déjà en prod`);
      } else if (APPLY) {
        const createdUser = await clerkPost<ClerkUser>(LIVE_KEY, "/users", {
          email_address: [primary.email_address],
          first_name: user.first_name ?? undefined,
          last_name: user.last_name ?? undefined,
          skip_password_requirement: true,
        });
        prodId = createdUser.id;
        prodByEmail.set(email, prodId);
        created++;
        console.log(`  + ${mask(email)} : créé en prod`);
      } else {
        console.log(`  + ${mask(email)} : serait créé en prod (dry-run)`);
        created++;
        continue;
      }

      // Re-lier le profil Supabase (clerk_id dev → prod)
      if (APPLY && prodId) {
        const { data, error } = await supabase
          .from("profiles")
          .update({ clerk_id: prodId })
          .eq("clerk_id", user.id)
          .select("id");
        if (error) throw error;
        if (data && data.length > 0) {
          relinked++;
          console.log(`      ↪ profil Supabase re-lié (plan conservé)`);
        }
      }
    } catch (err) {
      errors++;
      console.error(`  ✗ ${mask(email)} : ${(err as Error).message}`);
    }
  }

  console.log(`\n📊 Bilan : ${created} créés, ${skipped} ignorés, ${relinked} profils Supabase re-liés, ${errors} erreurs`);
  if (!APPLY) console.log("\n(Dry-run — relance avec --apply pour exécuter)");
}

main().catch((err) => {
  console.error("❌ Fatal:", (err as Error).message);
  process.exit(1);
});
