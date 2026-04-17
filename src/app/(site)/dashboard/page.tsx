import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ProfileTab from "./ProfileTab";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const name = user?.fullName ?? user?.firstName ?? "";

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  return (
    <ProfileTab
      profile={profile}
      clerkId={userId}
      userEmail={email}
      userName={name}
    />
  );
}
