import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.PINTEREST_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/vanzon/api/pinterest/callback`;
  const scope = "boards:read,boards:write,pins:read,pins:write,user_accounts:read";
  const state = Math.random().toString(36).slice(2);

  const url = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

  return NextResponse.redirect(url);
}
