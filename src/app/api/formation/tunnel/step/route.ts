import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const STEP_ORDER = ["optin", "vsl", "booking", "confirmed"] as const;

const schema = z.object({
  email: z.string().email(),
  step: z.enum(["vsl", "booking", "confirmed"]),
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { email, step } = schema.parse(body);

    const supabase = createSupabaseAdmin();

    // Get current step to prevent regression
    const { data: lead } = await supabase
      .from("vba_funnel_leads")
      .select("step_reached")
      .eq("email", email)
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const currentIdx = STEP_ORDER.indexOf(lead.step_reached as (typeof STEP_ORDER)[number]);
    const newIdx = STEP_ORDER.indexOf(step);

    if (newIdx <= currentIdx) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const update: Record<string, unknown> = { step_reached: step };
    if (step === "confirmed") {
      update.call_booked_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("vba_funnel_leads")
      .update(update)
      .eq("email", email);

    if (error) {
      console.error("[tunnel/step] Supabase error:", error);
      return NextResponse.json({ error: "Erreur mise à jour." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[tunnel/step] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
