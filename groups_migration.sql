-- Migration: Create groups table
-- Execute this in the Supabase SQL Editor to enable the groups feature.

-- Falls vorhanden, alte Tabelle löschen (Löscht bestehende Gruppen!)
-- DROP TABLE IF EXISTS public.groups CASCADE;

CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS aktivieren
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write access for anon and authenticated users (suitable for local network deployment)
DROP POLICY IF EXISTS "Allow all actions for groups" ON public.groups;
CREATE POLICY "Allow all actions for groups" ON public.groups 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Fremdschlüssel-Verknüpfung in der articles-Tabelle sicherstellen
-- (Fügt die Spalte 'group_id' hinzu, falls sie noch nicht existiert)
ALTER TABLE IF EXISTS public.articles 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
