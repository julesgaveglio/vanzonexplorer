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
  const url = params.get("url");

  const target = url || "https://vanzonexplorer.com";

  // Track the click (fire and forget)
  if (email && campaign) {
    const supabase = createSupabaseAdmin();
    supabase
      .from("email_clicks")
      .insert({
        email,
        campaign_name: campaign,
        clicked_url: target,
      })
      .then(() => {})
      .catch(() => {});
  }

  return NextResponse.redirect(new URL(target));
}
