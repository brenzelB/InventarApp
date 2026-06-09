-- Migration: Create article_comments table
-- Execute this in the Supabase SQL Editor to enable the article comments feature.

-- Falls vorhanden, alte Tabelle löschen
DROP TABLE IF EXISTS public.article_comments CASCADE;

CREATE TABLE public.article_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    -- WICHTIG: Referenz auf public.profiles statt auth.users, damit PostgREST den Join auflösen kann!
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
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
