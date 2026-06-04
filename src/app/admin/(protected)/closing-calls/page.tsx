import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ClosingCallsPanel from "./_components/ClosingCallsPanel";

export const metadata: Metadata = {
  title: "Closing Calls — Admin Vanzon",
  robots: { index: false, follow: false },
};

export interface ClosingCall {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  scheduled_at: string;
  calendar_event_id: string | null;
  notes: string | null;
  status: "upcoming" | "completed" | "no_show" | "cancelled";
  whatsapp_sent_at: string | null;
  whatsapp_message: string | null;
  transcript: string | null;
  analysis: {
    summary: string;
    score: number;
    good: string[];
    bad: string[];
    improvements: string[];
    next_steps: string[];
  } | null;
  created_at: string;
  updated_at: string;
}

async function getClosingCalls(): Promise<ClosingCall[]> {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("closing_calls")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (error) {
    console.error("Error fetching closing calls:", error);
    return [];
  }

  return (data as ClosingCall[]) ?? [];
}

export default async function ClosingCallsPage() {
  const calls = await getClosingCalls();

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <ClosingCallsPanel initialCalls={calls} />
    </div>
  );
}
