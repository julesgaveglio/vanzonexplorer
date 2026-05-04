import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { data: promo } = await supabase
    .from("promo_codes")
    .select("id, formation_id, discount_percent, max_uses, uses_count, is_active")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!promo || !promo.is_active) {
    return NextResponse.json({ error: "Code promo invalide" }, { status: 404 });
  }

  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ error: "Code promo expiré" }, { status: 410 });
  }

  // Check if already has access
  const { data: existing } = await supabase
    .from("formation_access")
    .select("id")
    .eq("clerk_id", userId)
    .eq("formation_id", promo.formation_id)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Grant access + increment uses
  await Promise.all([
    supabase.from("formation_access").insert({
      clerk_id: userId,
      formation_id: promo.formation_id,
    }),
    supabase
      .from("promo_codes")
      .update({ uses_count: (promo.uses_count ?? 0) + 1 })
      .eq("id", promo.id),
  ]);

  // Get user info for Telegram notification
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "—";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Inconnu";

  // Get formation name
  const { data: formation } = await supabase
    .from("formations")
    .select("name")
    .eq("id", promo.formation_id)
    .single();

  // Telegram notification
  notifyPromoActivation(name, email, code.toUpperCase().trim(), formation?.name ?? "—").catch(() => {});

  return NextResponse.json({ ok: true });
}

async function notifyPromoActivation(
  name: string,
  email: string,
  code: string,
  formationName: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🎟️ <b>CODE PROMO ACTIVÉ</b>\n` +
    `─────────────────────\n` +
    `<b>Formation :</b> ${formationName}\n` +
    `<b>Nom :</b> ${name}\n` +
    `<b>Email :</b> ${email}\n` +
    `<b>Code :</b> ${code}\n` +
    `─────────────────────\n` +
    `⚠️ Pense à désactiver le code si nécessaire.`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
