#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Test si la table existe déjà
  const { error: checkErr } = await supabase.from("draft_articles").select("id").limit(1);

  if (!checkErr) {
    console.log("✅ Table draft_articles existe déjà.");
    return;
  }

  console.log("⚙️  Création de la table draft_articles via SQL REST...");

  const sql = `
    CREATE TABLE IF NOT EXISTS draft_articles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Sans titre',
      html_content TEXT NOT NULL DEFAULT '',
      excerpt TEXT DEFAULT '',
      target_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'archived')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_draft_articles_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_draft_articles_updated_at ON draft_articles;
    CREATE TRIGGER trg_draft_articles_updated_at
      BEFORE UPDATE ON draft_articles
      FOR EACH ROW EXECUTE FUNCTION update_draft_articles_updated_at();
  `;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    // Essai via pg directement
    console.log("ℹ️  RPC non dispo. Création via Supabase DB URL directe...");
    const pgUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!pgUrl) {
      console.error("❌ Pas de SUPABASE_DB_URL. Crée la table manuellement dans Supabase Dashboard > SQL Editor :");
      console.log("\n" + sql);
      process.exit(1);
    }
  } else {
    console.log("✅ Table créée !");
  }
}

main().catch(console.error);
