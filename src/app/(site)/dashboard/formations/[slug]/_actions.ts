"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAILS = ["gavegliojules@gmail.com", "vanzonexplorer@gmail.com"];

async function requireFormationAccess(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email && ADMIN_EMAILS.includes(email)) return userId;

  const supabase = createSupabaseAdmin();

  // Check formation_access (each formation is independent)
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
