// One-shot script to create the vba_funnel_leads table in Supabase
// Run: npx tsx scripts/create-vba-funnel-table.ts

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creating vba_funnel_leads table...");

  const { error } = await supabase.rpc("exec_sql", {
    query: `
      CREATE TABLE IF NOT EXISTS vba_funnel_leads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        firstname TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now(),
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        step_reached TEXT DEFAULT 'optin',
        call_booked_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_vba_leads_email ON vba_funnel_leads(email);
    `,
  });

  if (error) {
    // If rpc doesn't exist, fall back to direct REST approach
    if (error.message.includes("exec_sql")) {
      console.log("\nThe exec_sql RPC function is not available.");
      console.log("Please run the following SQL directly in the Supabase SQL Editor:\n");
      console.log(`
CREATE TABLE IF NOT EXISTS vba_funnel_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  step_reached TEXT DEFAULT 'optin',
  call_booked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vba_leads_email ON vba_funnel_leads(email);
      `);
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }

  console.log("Table vba_funnel_leads created successfully!");

  // Verify
  const { data, error: testErr } = await supabase
    .from("vba_funnel_leads")
    .select("id")
    .limit(1);

  if (testErr) {
    console.error("Verification failed:", testErr.message);
  } else {
    console.log("Verification OK — table is accessible.");
  }
}

main();
