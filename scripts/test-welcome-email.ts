/**
 * Simule un achat VBA pour tester le flow complet :
 * 1. Crée/trouve le user Clerk
 * 2. Upsert Supabase profile → vba_member
 * 3. Envoie l'email de bienvenue via Resend
 *
 * Usage: npx tsx scripts/test-welcome-email.ts raphaellavier430@gmail.com "Raphael Lavier"
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createClerkClient } from "@clerk/backend";

const email = process.argv[2];
const name = process.argv[3] || "Raphael";

if (!email) {
  console.error("Usage: npx tsx scripts/test-welcome-email.ts <email> [name]");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log(`\n🎯 Simulation achat VBA pour ${email} (${name})\n`);

  // 1. Find or create Clerk user
  console.log("1️⃣  Clerk — recherche/création du user...");
  const existing = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });

  let clerkUserId: string;
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  if (existing.data.length > 0) {
    clerkUserId = existing.data[0].id;
    console.log(`   ✅ User existant trouvé : ${clerkUserId}`);
  } else {
    const newUser = await clerk.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      skipPasswordRequirement: true,
    });
    clerkUserId = newUser.id;
    console.log(`   ✅ User créé : ${clerkUserId}`);
  }

  // 2. Upsert Supabase profile
  console.log("2️⃣  Supabase — upsert profile vba_member...");
  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_id: clerkUserId,
      plan: "vba_member",
      email,
      full_name: name,
    },
    { onConflict: "clerk_id" }
  );

  if (error) {
    console.error("   ❌ Erreur Supabase:", error);
  } else {
    console.log("   ✅ Profile mis à jour → vba_member");
  }

  // 3. Send welcome email
  console.log("3️⃣  Resend — envoi email de bienvenue...");
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";

  const { data, error: emailError } = await resend.emails.send({
    from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
    to: email,
    subject: "Bienvenue dans la Van Business Academy — Crée ton mot de passe",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
        <img src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png" width="48" height="48" alt="Vanzon" style="border-radius: 12px; margin-bottom: 24px;" />
        <h1 style="font-size: 22px; color: #0F172A; margin: 0 0 16px;">
          Bienvenue ${firstName ? firstName + " " : ""}!
        </h1>
        <p style="font-size: 15px; color: #64748B; line-height: 1.6; margin: 0 0 24px;">
          Ton paiement a bien été reçu. Ta formation Van Business Academy est prête.
          Clique ci-dessous pour créer ton mot de passe et accéder à tes modules.
        </p>
        <a href="${siteUrl}/sign-in" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #B9945F 0%, #E4D398 100%); color: white; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px;">
          Créer mon mot de passe →
        </a>
        <p style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
          ID compte : ${clerkUserId}
        </p>
      </div>
    `,
  });

  if (emailError) {
    console.error("   ❌ Erreur email:", emailError);
  } else {
    console.log(`   ✅ Email envoyé ! (id: ${data?.id})`);
  }

  console.log("\n🎉 Simulation terminée. Vérifie la boîte mail de", email, "\n");
}

main().catch(console.error);
