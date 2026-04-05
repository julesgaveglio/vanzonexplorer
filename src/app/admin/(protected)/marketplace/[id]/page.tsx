import { createSupabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MarketplaceDetailClient from "./_components/MarketplaceDetailClient";

export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data: van } = await supabase
    .from("marketplace_vans")
    .select("*")
    .eq("id", id)
    .single();

  if (!van) notFound();

  return <MarketplaceDetailClient van={van} />;
}
