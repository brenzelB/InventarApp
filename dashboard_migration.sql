-- Migration for User Dashboard Configs
-- Execute this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_dashboard_configs (
    user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own dashboard config"
    ON public.user_dashboard_configs FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own dashboard config"
    ON public.user_dashboard_configs FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own dashboard config"
    ON public.user_dashboard_configs FOR UPDATE
    USING ( auth.uid() = user_id );

-- Optional: Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS set_user_dashboard_configs_updated_at ON public.user_dashboard_configs;
CREATE TRIGGER set_user_dashboard_configs_updated_at
BEFORE UPDATE ON public.user_dashboard_configs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
