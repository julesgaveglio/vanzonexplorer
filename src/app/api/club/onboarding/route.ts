import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { role, companyName, email, website, message } = body;

  const supabase = createSupabaseAdmin();

  await supabase.from("profiles").update({
    role,
    updated_at: new Date().toISOString(),
  }).eq("clerk_id", userId);

  if (role === "brand" && companyName) {
    await supabase.from("partnership_requests").insert({
      clerk_id: userId,
      company_name: companyName,
      email: email || "",
      website: website || null,
      message: message || null,
      status: "pending",
    });
  }

  return NextResponse.json({ success: true });
}
