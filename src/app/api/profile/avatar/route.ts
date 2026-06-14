import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format accepté : JPG, PNG ou WebP" },
      { status: 422 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 2 Mo)" },
      { status: 422 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Upload to Supabase Storage
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${userId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === "avatars")) {
    await supabase.storage.createBucket("avatars", { public: true });
  }

  // Delete old avatar if exists (different extension)
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list("", { search: userId });

  if (existingFiles?.length) {
    await supabase.storage
      .from("avatars")
      .remove(existingFiles.map((f) => f.name));
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // Update profile
  await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("clerk_id", userId);

  return NextResponse.json({ avatar_url: avatarUrl });
}
