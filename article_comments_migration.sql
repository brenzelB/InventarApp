-- Migration: Create article_comments table
-- Execute this in the Supabase SQL Editor to enable the article comments feature.

-- OPTION A: Falls die Tabelle bereits existiert und Daten erhalten bleiben sollen:
-- Führe diesen Befehl aus, um die Spalte 'author_name' hinzuzufügen:
-- ALTER TABLE public.article_comments ADD COLUMN IF NOT EXISTS author_name TEXT;

-- OPTION B: Tabelle komplett frisch anlegen (Löscht bestehende Kommentare!)
-- DROP TABLE IF EXISTS public.article_comments CASCADE;

CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    -- Referenz auf auth.users (existiert immer standardmäßig in Supabase)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    author_name TEXT, -- Speichert den Anzeigenamen direkt für maximale Unabhängigkeit von Profil-Tabellen
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);

-- Enable RLS
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write access for anon and authenticated users (suitable for local network deployment)
DROP POLICY IF EXISTS "Allow all actions for article_comments" ON public.article_comments;
CREATE POLICY "Allow all actions for article_comments" ON public.article_comments 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);
