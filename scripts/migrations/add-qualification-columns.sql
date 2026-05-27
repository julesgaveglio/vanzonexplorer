-- Add qualification columns to vba_funnel_leads
-- Run this migration in Supabase SQL Editor

ALTER TABLE vba_funnel_leads
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS q_objective text,
  ADD COLUMN IF NOT EXISTS q_profile text,
  ADD COLUMN IF NOT EXISTS q_budget text,
  ADD COLUMN IF NOT EXISTS is_hot boolean;
