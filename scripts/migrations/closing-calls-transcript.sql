-- Migration: Add transcript and analysis columns to closing_calls
-- Date: 2026-06-04

ALTER TABLE closing_calls ADD COLUMN IF NOT EXISTS transcript text;
ALTER TABLE closing_calls ADD COLUMN IF NOT EXISTS analysis jsonb;
