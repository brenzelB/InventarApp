-- Migration for Article Grid Persistence
-- Execute this in the Supabase SQL Editor

ALTER TABLE public.user_dashboard_configs 
ADD COLUMN IF NOT EXISTS article_grid_config JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS is still valid (it should be since the table already has policies)
-- The existing policies allow users to view/insert/update their own rows.
