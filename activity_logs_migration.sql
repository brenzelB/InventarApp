-- Migration: Comprehensive Activity Logging
-- Execute this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'create', 'delete', 'import', 'update', 'stock_adjustment'
    message TEXT NOT NULL,
    article_id UUID, -- No FK to allow history to persist after article deletion
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users to view logs (Team visibility)
DROP POLICY IF EXISTS "Allow authenticated users to view logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated users to view logs" ON public.activity_logs
    FOR SELECT TO authenticated USING (true);

-- Policies: Allow service/system to insert logs
DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated users to insert logs" ON public.activity_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
