"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(lessonId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

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
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

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
