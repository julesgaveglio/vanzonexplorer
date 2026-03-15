"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// Types

export type ProspectStatus =
  | "a_traiter"
  | "enrichi"
  | "email_genere"
  | "contacte"
  | "relance"
  | "en_discussion"
  | "accepte"
  | "refuse"
  | "a_revoir";

export interface ContactEntry {
  name: string;
  role: string;
  email: string;
  priority: number;
}

export interface ContactHistoryEntry {
  date: string;
  action: string;
  notes: string;
}

export interface Prospect {
  id: string;
  type: string | null;
  category: string | null;
  name: string;
  country: string | null;
  website: string | null;
  description: string | null;
  strategic_interest: string | null;
  relevance_score: number;
  emails: string[];
  contacts: ContactEntry[];
  status: ProspectStatus;
  last_contact_at: string | null;
  internal_notes: string | null;
  generated_subject: string | null;
  generated_email: string | null;
  contact_history: ContactHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface ProspectFilters {
  search?: string;
  category?: string;
  status?: ProspectStatus;
  country?: string;
  sortBy?: "relevance_score" | "created_at" | "name" | "last_contact_at";
  sortOrder?: "asc" | "desc";
}

// Actions

export async function getProspects(filters?: ProspectFilters): Promise<Prospect[]> {
  const supabase = createSupabaseAdmin();

  const sortBy = filters?.sortBy ?? "relevance_score";
  const sortOrder = filters?.sortOrder ?? "desc";

  let query = supabase
    .from("prospects")
    .select("*")
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.country) {
    query = query.eq("country", filters.country);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []) as Prospect[];
}

export async function getProspect(id: string): Promise<Prospect> {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Prospect not found: ${id}`);

  return data as Prospect;
}

export async function upsertProspect(
  data: Partial<Prospect> & { name: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();

    if (data.id) {
      const { id, ...rest } = data;
      const { data: updated, error } = await supabase
        .from("prospects")
        .update({ ...rest, updated_at: now })
        .eq("id", id)
        .select("id")
        .single();

      if (error) return { success: false, error: error.message };

      revalidatePath("/admin/club/prospection");
      return { success: true, id: updated?.id };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...rest } = data as Partial<Prospect> & { name: string };
      const { data: inserted, error } = await supabase
        .from("prospects")
        .insert({ ...rest, updated_at: now })
        .select("id")
        .single();

      if (error) return { success: false, error: error.message };

      revalidatePath("/admin/club/prospection");
      return { success: true, id: inserted?.id };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateProspectStatus(
  id: string,
  status: ProspectStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("prospects")
      .update({ status, updated_at: now })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/club/prospection");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateProspectEmailDraft(
  id: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("prospects")
      .update({
        generated_subject: subject,
        generated_email: body,
        status: "email_genere" as ProspectStatus,
        updated_at: now,
      })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/club/prospection");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteProspect(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();

    const { error } = await supabase.from("prospects").delete().eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/club/prospection");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function bulkInsertProspects(
  prospects: Array<Partial<Prospect> & { name: string; website?: string }>
): Promise<{ success: boolean; inserted: number; skipped: number; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();

    // Collect all websites to dedup against DB
    const websites = prospects
      .map((p) => p.website)
      .filter((w): w is string => !!w);

    let existingWebsites = new Set<string>();

    if (websites.length > 0) {
      const { data: existing, error: fetchError } = await supabase
        .from("prospects")
        .select("website")
        .in("website", websites);

      if (fetchError) return { success: false, inserted: 0, skipped: 0, error: fetchError.message };

      existingWebsites = new Set(
        (existing ?? []).map((r: { website: string }) => r.website).filter(Boolean)
      );
    }

    const toInsert = prospects.filter(
      (p) => !p.website || !existingWebsites.has(p.website)
    );

    const skipped = prospects.length - toInsert.length;

    if (toInsert.length === 0) {
      return { success: true, inserted: 0, skipped };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows = toInsert.map(({ id: _id2, ...rest }) => ({
      ...rest,
      updated_at: now,
    }));

    const { error: insertError } = await supabase.from("prospects").insert(rows);

    if (insertError) return { success: false, inserted: 0, skipped, error: insertError.message };

    revalidatePath("/admin/club/prospection");
    return { success: true, inserted: toInsert.length, skipped };
  } catch (err) {
    return { success: false, inserted: 0, skipped: 0, error: String(err) };
  }
}

export async function addContactHistory(
  id: string,
  entry: ContactHistoryEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: prospect, error: fetchError } = await supabase
      .from("prospects")
      .select("contact_history")
      .eq("id", id)
      .single();

    if (fetchError) return { success: false, error: fetchError.message };

    const currentHistory: ContactHistoryEntry[] =
      Array.isArray(prospect?.contact_history) ? prospect.contact_history : [];

    const updatedHistory = [...currentHistory, entry];

    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        contact_history: updatedHistory,
        last_contact_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath("/admin/club/prospection");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
