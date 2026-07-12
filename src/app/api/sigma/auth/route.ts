import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  getSigmaSession,
  createSigmaSessionToken,
  verifyPasswordHash,
  SIGMA_COOKIE_NAME,
  SIGMA_COOKIE_MAX_AGE,
} from "../_helpers/auth";

// GET — check current session
export async function GET() {
  const session = await getSigmaSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}

// POST — login
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: user } = await supabase
    .from("sigma_users")
    .select("id, email, role, password_hash")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  if (!verifyPasswordHash(password, user.password_hash)) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const token = createSigmaSessionToken({ id: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true, user: { email: user.email, role: user.role } });
  res.cookies.set(SIGMA_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SIGMA_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}

// DELETE — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SIGMA_COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
