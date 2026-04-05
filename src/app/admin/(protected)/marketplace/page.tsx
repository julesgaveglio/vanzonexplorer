import { createSupabaseAdmin } from "@/lib/supabase/server";
import MarketplaceClient from "./_components/MarketplaceClient";

export type MarketplaceVan = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "approved" | "rejected";
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  van_type: string;
  van_brand: string;
  van_model: string;
  van_year: number | null;
  seats: number | null;
  sleeps: number;
  transmission: string;
  equipments: string[];
  title: string;
  description: string;
  photos: string[];
  price_per_day: number;
  min_days: number;
  deposit: number | null;
  location_city: string;
  booking_url: string | null;
  admin_notes: string | null;
};

export default async function AdminMarketplacePage() {
  const supabase = createSupabaseAdmin();
  const { data: vans } = await supabase
    .from("marketplace_vans")
    .select("*")
    .order("created_at", { ascending: false });

  return <MarketplaceClient vans={(vans as MarketplaceVan[]) || []} />;
}
