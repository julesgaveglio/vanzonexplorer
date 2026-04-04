import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => ({}));
  const { recipientEmail }: { recipientEmail?: string } = body;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("backlink_outreach")
    .update({
      approved: true,
      ...(recipientEmail ? { recipient_email: recipientEmail } : {}),
    })
    .eq("id", params.id);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
