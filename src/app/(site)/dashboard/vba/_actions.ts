"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = "gavegliojules@gmail.com";

async function requireVBAAccess(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email === ADMIN_EMAIL) return userId;

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

  revalidatePath("/dashboard/vba");
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

  revalidatePath("/dashboard/vba");
}
