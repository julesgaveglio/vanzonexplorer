import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("marketplace_templates")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[marketplace-templates] GET error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, message, label, tone, tone_icon, target } = body;

    if (!id || !message) {
      return NextResponse.json({ error: "id et message requis" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("marketplace_templates")
      .update({ message, label, tone, tone_icon, target, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[marketplace-templates] PUT error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { action } = body;

    // Seed: insérer les templates par défaut
    if (action === "seed") {
      const supabase = createSupabaseAdmin();
      const { data: existing } = await supabase
        .from("marketplace_templates")
        .select("id")
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ message: "Templates already seeded" });
      }

      const { templates } = body;
      const { error } = await supabase.from("marketplace_templates").insert(templates);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Create new template
    const { message, label, tone, tone_color, tone_icon, target, sort_order } = body;
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("marketplace_templates")
      .insert({ message, label, tone, tone_color, tone_icon, target, sort_order })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[marketplace-templates] POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("marketplace_templates").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[marketplace-templates] DELETE error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
