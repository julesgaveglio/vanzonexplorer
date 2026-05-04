"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "gavegliojules@gmail.com";

async function requireFormationAccess(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email === ADMIN_EMAIL) return userId;

  const supabase = createSupabaseAdmin();

  // Check vba_member (full access) OR formation_access
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("clerk_id", userId)
    .single();
  if (profile?.plan === "vba_member") return userId;

  const { data: access } = await supabase
    .from("formation_access")
    .select("id")
    .eq("clerk_id", userId)
    .limit(1);
  if (access && access.length > 0) return userId;

  throw new Error("Accès refusé");
}

export async function markFormationLessonComplete(lessonId: string) {
  const userId = await requireFormationAccess();
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

  revalidatePath("/dashboard/formations");
}

export async function markFormationLessonIncomplete(lessonId: string) {
  const userId = await requireFormationAccess();
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

  revalidatePath("/dashboard/formations");
}
