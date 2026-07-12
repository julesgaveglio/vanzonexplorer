import { cookies } from "next/headers";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const COOKIE_NAME = "sigma_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!SECRET) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante — requise pour signer les sessions Sigma");
}

// Comparaison en temps constant (évite les attaques par timing sur les hex digests)
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

interface SigmaSessionPayload {
  user_id: string;
  email: string;
  role: string;
  exp: number;
}

function sign(payload: SigmaSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${data}.${sig}`;
}

function verify(token: string): SigmaSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  if (!safeEqualHex(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SigmaSessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSigmaSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;

  // Verify user still exists in sigma_users
  const supabase = createSupabaseAdmin();
  const { data: user } = await supabase
    .from("sigma_users")
    .select("id, email, role")
    .eq("id", payload.user_id)
    .single();

  if (!user) return null;
  return { user_id: user.id, email: user.email, role: user.role };
}

export async function requireSigmaAuth() {
  const session = await getSigmaSession();
  if (session) return session;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function createSigmaSessionToken(user: { id: string; email: string; role: string }): string {
  return sign({
    user_id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  });
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Compare un hash de mot de passe en temps constant
export function verifyPasswordHash(password: string, expectedHash: string | null | undefined): boolean {
  if (!expectedHash) return false;
  return safeEqualHex(hashPassword(password), expectedHash);
}

export const SIGMA_COOKIE_NAME = COOKIE_NAME;
export const SIGMA_COOKIE_MAX_AGE = MAX_AGE;
