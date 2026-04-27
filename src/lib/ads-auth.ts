import { cookies } from "next/headers";
import crypto from "crypto";
import { NextResponse } from "next/server";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-fallback-secret-key-32chars";
const COOKIE_NAME = "ads_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Pre-computed SHA-256 password hashes
const USERS: Record<string, string> = {
  "gavegliojules@gmail.com": "ba38d573193a93e95dd51adf4c53b91e59fac058b4d9cc8f32ea9648d4c85693",
};

interface SessionPayload {
  email: string;
  exp: number;
}

function sign(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${data}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdsSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  return payload ? { email: payload.email } : null;
}

export function createSessionToken(email: string): string {
  return sign({ email, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
}

export function validateCredentials(email: string, password: string): boolean {
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  return USERS[email] === hash;
}

export async function requireAdsAuth() {
  const session = await getAdsSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export const ADS_COOKIE_NAME = COOKIE_NAME;
export const ADS_COOKIE_MAX_AGE = MAX_AGE;
