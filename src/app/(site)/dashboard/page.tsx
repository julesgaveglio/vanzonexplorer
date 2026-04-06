import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  redirect("/proprietaire/dashboard");
}
