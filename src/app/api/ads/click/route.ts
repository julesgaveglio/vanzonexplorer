import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Tracking redirect — used in broadcast emails.
 * /api/ads/click?email=X&campaign=Y&url=Z
 * Logs the click in email_clicks, then redirects to the target URL.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const email = params.get("email");
  const campaign = params.get("campaign");
  const url = params.get("url") || "https://vanzonexplorer.com";

  // Track the click + notify Telegram
  if (email && campaign) {
    const supabase = createSupabaseAdmin();
    void supabase.from("email_clicks").insert({
      email,
      campaign_name: campaign,
      clicked_url: url,
    });

    // Telegram notification
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const text =
        `📩 <b>Clic email → Calendly</b>\n` +
        `─────────────────────\n` +
        `<b>Email :</b> ${email}\n` +
        `<b>Campagne :</b> ${campaign}`;

      void fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
    }
  }

  return NextResponse.redirect(new URL(url, req.url));
}
