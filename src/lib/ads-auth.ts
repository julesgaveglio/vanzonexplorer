import { cookies } from "next/headers";
import crypto from "crypto";
import { NextResponse } from "next/server";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-fallback-secret-key-32chars";
const COOKIE_NAME = "ads_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Roles: admin = full access, viewer = read-only (no edit/delete)
type AdsRole = "admin" | "viewer";

// Pre-computed SHA-256 password hashes + roles
const USERS: Record<string, { hash: string; role: AdsRole }> = {
  "gavegliojules@gmail.com": { hash: "ba38d573193a93e95dd51adf4c53b91e59fac058b4d9cc8f32ea9648d4c85693", role: "admin" },
  "mateogb.ads@gmail.com": { hash: "912fa39a344628f4500ebef5a73fae7a9d7ee48db7e9796b101f3a86c3f74d0a", role: "admin" },
  "contact@sigmaipf.fr": { hash: "a20e7cff82c45d613a6badc8789a366f412e5d3b910e627eb601d81ef1546941", role: "viewer" },
};

interface SessionPayload {
  email: string;
  role: AdsRole;
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

export async function getAdsSession(): Promise<{ email: string; role: AdsRole } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  return payload ? { email: payload.email, role: payload.role ?? "admin" } : null;
}

export function createSessionToken(email: string): string {
  const role = USERS[email]?.role ?? "admin";
  return sign({ email, role, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
}

export function validateCredentials(email: string, password: string): boolean {
  const hash = crypto.createHash("sha256").update(password).digest("hex");
  return USERS[email]?.hash === hash;
}

export function getUserRole(email: string): AdsRole {
  return USERS[email]?.role ?? "viewer";
}

export async function requireAdsAuth() {
  // Check ads cookie first
  const session = await getAdsSession();
  if (session) return session;

  // Fall back to Clerk admin auth
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      const { currentUser } = await import("@clerk/nextjs/server");
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress;
      if (email === "gavegliojules@gmail.com") {
        return { email };
      }
    }
  } catch {
    // Clerk not available
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const ADS_COOKIE_NAME = COOKIE_NAME;
export const ADS_COOKIE_MAX_AGE = MAX_AGE;
