import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  first_name: z.string().min(2, "Prénom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  van_model: z.string().min(2, "Marque et modèle requis"),
  van_type: z.enum(["fourgon", "minibus", "autre"]),
  sleeps: z.coerce.number().min(1).max(10),
  location: z.string().min(2, "Localisation requise"),
  platform_url: z.string().url().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("van_owner_leads").insert({
      ...data,
      platform_url: data.platform_url || null,
    });

    if (error) {
      console.error("[van-owner/submit] Supabase error:", error);
      return NextResponse.json(
        { error: "Erreur lors de l'inscription." },
        { status: 500 }
      );
    }

    // Notification Telegram (non-bloquante)
    notifyTelegram(data).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error("[van-owner/submit] Error:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

async function notifyTelegram(data: z.infer<typeof schema>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚐 <b>Nouveau propriétaire intéressé !</b>\n` +
    `─────────────────────\n` +
    `<b>Prénom :</b> ${data.first_name}\n` +
    `<b>Tél :</b> ${data.phone}\n` +
    `<b>Email :</b> ${data.email}\n` +
    `<b>Van :</b> ${data.van_model} (${data.van_type})\n` +
    `<b>Couchages :</b> ${data.sleeps}\n` +
    `<b>Localisation :</b> ${data.location}\n` +
    (data.platform_url ? `<b>Annonce :</b> ${data.platform_url}\n` : "") +
    `─────────────────────\n` +
    `→ Contacter rapidement !`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
