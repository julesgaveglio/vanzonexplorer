"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAILS = ["gavegliojules@gmail.com", "vanzonexplorer@gmail.com"];

async function requireVBAAccess(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email && ADMIN_EMAILS.includes(email)) return userId;

  // Check vba_member plan
  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("clerk_id", userId)
    .single();
  if (profile?.plan !== "vba_member") {
    throw new Error("Accès refusé");
  }

  return userId;
}

export async function markLessonComplete(lessonId: string) {
  const userId = await requireVBAAccess();

  const supabase = createSupabaseAdmin();

  await supabase.from("vba_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      watch_percentage: 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  revalidatePath("/espace-membre/vba");
}

export async function markLessonIncomplete(lessonId: string) {
  const userId = await requireVBAAccess();

  const supabase = createSupabaseAdmin();

  await supabase.from("vba_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed: false,
      completed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  revalidatePath("/espace-membre/vba");
}

// ---------- VBA Comments ----------

export async function addComment(lessonId: string, content: string, parentId?: string) {
  const userId = await requireVBAAccess();

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Commentaire invalide");
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("vba_comments").insert({
    lesson_id: lessonId,
    user_id: userId,
    content: trimmed,
    parent_id: parentId ?? null,
  });

  if (error) throw new Error("Erreur lors de l'ajout du commentaire");

  revalidatePath("/espace-membre/vba");
}

export async function deleteComment(commentId: string) {
  const userId = await requireVBAAccess();

  const supabase = createSupabaseAdmin();

  // Check ownership or admin
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);

  if (!isAdmin) {
    const { data: comment } = await supabase
      .from("vba_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();
    if (comment?.user_id !== userId) {
      throw new Error("Non autorisé");
    }
  }

  const { error } = await supabase
    .from("vba_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw new Error("Erreur lors de la suppression");

  revalidatePath("/espace-membre/vba");
}
