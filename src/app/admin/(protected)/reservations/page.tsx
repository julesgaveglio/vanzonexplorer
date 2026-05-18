import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ReservationsPanel from "./_components/ReservationsPanel";

export const metadata: Metadata = {
  title: "Reservations — Admin Vanzon",
  robots: { index: false, follow: false },
};

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

async function getReservations(): Promise<Reservation[]> {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }

  return (data as Reservation[]) ?? [];
}

export default async function ReservationsPage() {
  const reservations = await getReservations();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ReservationsPanel initialReservations={reservations} />
    </div>
  );
}
