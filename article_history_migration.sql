-- Migration: Create article_history table
-- Execute this in the Supabase SQL Editor to enable the stock history logging feature.

CREATE TABLE IF NOT EXISTS public.article_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    old_stock NUMERIC NOT NULL,
    new_stock NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('input', 'output')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_article_history_article_id ON public.article_history(article_id);
CREATE INDEX IF NOT EXISTS idx_article_history_created_at ON public.article_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.article_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write access for anon and authenticated users (suitable for local network deployment)
DROP POLICY IF EXISTS "Allow all actions for article_history" ON public.article_history;
CREATE POLICY "Allow all actions for article_history" ON public.article_history 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);
