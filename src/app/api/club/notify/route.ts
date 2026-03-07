import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Email invalide" }, { status: 400 });
    }

    const { error } = await supabase
      .from("club_waitlist")
      .upsert({ email, created_at: new Date().toISOString() }, { onConflict: "email" });

    if (error) {
      console.error("[club/notify]", error);
      return Response.json({ error: "Erreur base de données" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[club/notify]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
