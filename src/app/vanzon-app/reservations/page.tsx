import { createSupabaseAdmin } from "@/lib/supabase/server";
import MobileReservations from "./_components/MobileReservations";

// Redefine Reservation type here (same as admin version)
export interface Reservation {
  id: string;
  platform: "yescapa" | "wikicampers";
  platform_ref: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  van_name: string | null;
  start_date: string | null;
  end_date: string | null;
  revenue: number | null;
  status: "confirmed" | "in_progress" | "completed" | "cancelled";
  destination: string | null;
  travelers_count: number | null;
  insurance: string | null;
  km_included: string | null;
  whatsapp_pre_sent_at: string | null;
  whatsapp_post_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default async function MobileReservationsPage() {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .order("start_date", { ascending: false });

  return <MobileReservations reservations={(data ?? []) as Reservation[]} />;
}
