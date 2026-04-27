import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSessionToken, ADS_COOKIE_NAME, ADS_COOKIE_MAX_AGE } from "@/lib/ads-auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  if (!validateCredentials(email, password)) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const token = createSessionToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADS_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADS_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
