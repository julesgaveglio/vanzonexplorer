import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const VBA_ADMIN_EMAIL = "vanzonexplorer@gmail.com";

async function requireVBAAdmin() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== VBA_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId, email };
}

// PUT — Save lesson content (HTML)
export async function PUT(req: NextRequest) {
  const check = await requireVBAAdmin();
  if (check instanceof NextResponse) return check;

  const { lessonId, content } = await req.json();
  if (!lessonId || typeof content !== "string") {
    return NextResponse.json({ error: "lessonId and content required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("vba_lessons")
    .update({ lesson_content: content })
    .eq("id", lessonId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// POST — Upload image to Supabase Storage
export async function POST(req: NextRequest) {
  const check = await requireVBAAdmin();
  if (check instanceof NextResponse) return check;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const lessonId = formData.get("lessonId") as string | null;

  if (!file || !lessonId) {
    return NextResponse.json({ error: "file and lessonId required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${lessonId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from("vba-content")
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("vba-content")
    .getPublicUrl(filename);

  return NextResponse.json({ url: urlData.publicUrl });
}
