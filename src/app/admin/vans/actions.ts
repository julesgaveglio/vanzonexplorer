"use server";

import { adminWriteClient } from "@/lib/sanity/adminClient";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non autorise");
}

export async function toggleVanFeatured(id: string, current: boolean) {
  await requireAuth();
  await adminWriteClient.patch(id).set({ featured: !current }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/vans");
}

export async function updateVanStatus(id: string, status: string) {
  await requireAuth();
  await adminWriteClient.patch(id).set({ status }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/vans");
}
