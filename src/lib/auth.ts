import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId };
}
