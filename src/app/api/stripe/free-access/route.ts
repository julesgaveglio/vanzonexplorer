import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const FREE_CODES = ["OFFREDELANCEMENT"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Connecte-toi d'abord pour activer le code." }, { status: 401 });
  }

  const { code } = await req.json();
  const upperCode = (code || "").toUpperCase().trim();

  if (!FREE_CODES.includes(upperCode)) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  // Upsert profile with vba_member plan
  await supabase.from("profiles").upsert(
    {
      clerk_id: userId,
      email,
      full_name: name,
      plan: "vba_member",
    },
    { onConflict: "clerk_id" }
  );

  // Telegram notification
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const text = `🎟️ <b>ACCÈS GRATUIT VBA</b>\n${name || "—"} — ${email || "—"}\nCode : ${upperCode}`;
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
