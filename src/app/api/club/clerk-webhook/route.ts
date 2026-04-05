import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address || null;

    await supabase.from("profiles").upsert({
      clerk_id: id,
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      subscription_status: "free",
    }, { onConflict: "clerk_id" });

    // Notification Telegram
    notifyNewUser({ id, email, first_name, last_name }).catch(() => {});
  }

  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address || null;

    await supabase.from("profiles").update({
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      updated_at: new Date().toISOString(),
    }).eq("clerk_id", id);
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) await supabase.from("profiles").delete().eq("clerk_id", id);
  }

  return NextResponse.json({ success: true });
}

async function notifyNewUser({
  id,
  email,
  first_name,
  last_name,
}: {
  id: string;
  email: string | null;
  first_name: string | null | undefined;
  last_name: string | null | undefined;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const name = [first_name, last_name].filter(Boolean).join(" ") || "—";
  const text =
    `👤 <b>Nouvel inscrit sur Vanzon !</b>\n` +
    `─────────────────────\n` +
    `<b>Nom :</b> ${name}\n` +
    `<b>Email :</b> ${email ?? "—"}\n` +
    `<b>ID Clerk :</b> <code>${id}</code>\n` +
    `─────────────────────\n` +
    `<a href="https://vanzonexplorer.com/admin/marketplace">👉 Admin marketplace</a>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
