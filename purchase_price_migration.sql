-- Migration for adding purchase_price to articles
-- Execute this in the Supabase SQL Editor

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(15, 2) DEFAULT 0.00;
