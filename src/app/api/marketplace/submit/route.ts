import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  owner_first_name: z.string().min(2, "Prénom requis"),
  owner_last_name: z.string().min(2, "Nom requis"),
  owner_email: z.string().email("Email invalide"),
  owner_phone: z.string().min(8, "Téléphone requis"),
  van_type: z.enum(["fourgon", "van", "combi", "camping-car", "autre"]),
  van_brand: z.string().min(1, "Marque requise"),
  van_model: z.string().min(1, "Modèle requis"),
  van_year: z.coerce.number().min(1990).max(2027).optional(),
  seats: z.coerce.number().min(1).max(10).optional(),
  sleeps: z.coerce.number().min(1).max(10),
  transmission: z.enum(["manuelle", "automatique"]).default("manuelle"),
  equipments: z.array(z.string()).default([]),
  title: z.string().min(5, "Titre trop court").max(100),
  description: z.string().min(50, "Description trop courte (min 50 caractères)").max(2000),
  photos: z.array(z.string().url()).min(3, "Minimum 3 photos").max(15),
  price_per_day: z.coerce.number().min(20).max(500),
  min_days: z.coerce.number().min(1).max(30).default(2),
  deposit: z.coerce.number().min(0).max(5000).optional(),
  location_city: z.string().min(2, "Ville requise"),
  booking_url: z.string().url("Lien invalide").or(z.literal("")).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("marketplace_vans").insert({
      ...data,
      booking_url: data.booking_url || null,
      deposit: data.deposit || null,
      van_year: data.van_year || null,
      seats: data.seats || null,
    });

    if (error) {
      console.error("[marketplace/submit] Supabase error:", error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
    }

    notifyTelegram(data).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[marketplace/submit] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

async function notifyTelegram(data: z.infer<typeof schema>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚐 <b>Nouvelle fiche van marketplace !</b>\n` +
    `─────────────────────\n` +
    `<b>Proprio :</b> ${data.owner_first_name} ${data.owner_last_name}\n` +
    `<b>Tél :</b> ${data.owner_phone}\n` +
    `<b>Email :</b> ${data.owner_email}\n` +
    `<b>Van :</b> ${data.van_brand} ${data.van_model} (${data.van_type})\n` +
    `<b>Titre :</b> ${data.title}\n` +
    `<b>Prix :</b> ${data.price_per_day}€/jour\n` +
    `<b>Couchages :</b> ${data.sleeps}\n` +
    `<b>Ville :</b> ${data.location_city}\n` +
    `<b>Photos :</b> ${data.photos.length}\n` +
    (data.booking_url ? `<b>Lien :</b> ${data.booking_url}\n` : "") +
    `─────────────────────\n` +
    `→ Vérifier dans /admin/marketplace`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
