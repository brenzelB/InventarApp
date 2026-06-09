-- ==========================================
-- INVENTAR-APP: KONSOLIDIERTES DATENBANK-SCHEMA
-- ==========================================
-- Kopiere dieses Skript und führe es im Supabase SQL-Editor aus.
-- Es stellt sicher, dass alle Tabellen, Indizes, Trigger und RLS-Richtlinien
-- dem aktuellen Live-Stand der Anwendung entsprechen.

-- ──────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- 2. TABELLEN DEFINIEREN
-- ──────────────────────────────────────────────────────────────

-- Tabelle: profiles (Benutzerprofile mit Rollenverwaltung)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: invitations (Einladungen für Teammitglieder)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: groups (Warengruppen / Kategorien)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: articles (Artikeldatenbank - deutsche Spalten)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    herstellpreis NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    verkaufspreis NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    purchase_price NUMERIC(15, 2) DEFAULT 0.00,
    bestand NUMERIC DEFAULT 0 NOT NULL,
    mindestbestand NUMERIC DEFAULT 0 NOT NULL,
    qr_code TEXT,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    lagerort TEXT,
    unit TEXT DEFAULT 'Stk' NOT NULL,
    tax_rate NUMERIC DEFAULT 19,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: article_history (Lagerbewegungen / Historie)
CREATE TABLE IF NOT EXISTS public.article_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    old_stock NUMERIC NOT NULL,
    new_stock NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('input', 'output')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: article_comments (Kommentare zu Artikeln)
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    -- WICHTIG: Referenz auf public.profiles(id) für PostgREST
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: activity_logs (System-Aktivitätenprotokoll)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    type TEXT NOT NULL, -- 'create', 'delete', 'import', 'update', 'stock_adjustment'
    message TEXT NOT NULL,
    article_id UUID, -- Keine FK-Constraint, damit Logs nach Artikellöschung erhalten bleiben
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: user_dashboard_configs (Benutzerdefinierte Dashboard-Layouts)
CREATE TABLE IF NOT EXISTS public.user_dashboard_configs (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    article_grid_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabelle: settings (Globale App-Einstellungen)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ──────────────────────────────────────────────────────────────
-- 3. INDIZES FÜR BESSERE PERFORMANCE
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_group_id ON public.articles(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_history_article_id ON public.article_history(article_id);
CREATE INDEX IF NOT EXISTS idx_article_history_created_at ON public.article_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ──────────────────────────────────────────────────────────────
-- 4. HILFSFUNKTIONEN & TRIGGER (AUTOMATISCHE UPDATED_AT TIMESTAMPS)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger anlegen
DROP TRIGGER IF EXISTS set_user_dashboard_configs_updated_at ON public.user_dashboard_configs;
CREATE TRIGGER set_user_dashboard_configs_updated_at
    BEFORE UPDATE ON public.user_dashboard_configs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_articles_updated_at ON public.articles;
CREATE TRIGGER set_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_settings_updated_at ON public.settings;
CREATE TRIGGER set_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 5. TRIGGER FÜR AUTOMATISCHES BENUTZERPROFIL BEI REGISTRIERUNG
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger anlegen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS) & POLICIES
-- ──────────────────────────────────────────────────────────────

-- RLS auf allen Tabellen aktivieren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Richtlinien für einfache, lokale Netzwerknutzung (Anon & Authenticated freigegeben)
-- Hinweis: Im Produktivbetrieb mit externem Zugriff sollten diese restriktiver eingestellt werden.

-- Articles
DROP POLICY IF EXISTS "Allow all actions for articles" ON public.articles;
CREATE POLICY "Allow all actions for articles" ON public.articles 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Groups
DROP POLICY IF EXISTS "Allow all actions for groups" ON public.groups;
CREATE POLICY "Allow all actions for groups" ON public.groups 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Activity Logs
DROP POLICY IF EXISTS "Allow all actions for activity_logs" ON public.activity_logs;
CREATE POLICY "Allow all actions for activity_logs" ON public.activity_logs 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Article History
DROP POLICY IF EXISTS "Allow all actions for article_history" ON public.article_history;
CREATE POLICY "Allow all actions for article_history" ON public.article_history 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Article Comments
DROP POLICY IF EXISTS "Allow all actions for article_comments" ON public.article_comments;
CREATE POLICY "Allow all actions for article_comments" ON public.article_comments 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Settings
DROP POLICY IF EXISTS "Allow all actions for settings" ON public.settings;
CREATE POLICY "Allow all actions for settings" ON public.settings 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Invitations
DROP POLICY IF EXISTS "Allow all actions for invitations" ON public.invitations;
CREATE POLICY "Allow all actions for invitations" ON public.invitations 
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Profiles
DROP POLICY IF EXISTS "Allow select for profiles" ON public.profiles;
CREATE POLICY "Allow select for profiles" ON public.profiles 
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for self" ON public.profiles;
CREATE POLICY "Allow insert for self" ON public.profiles 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow update for self or admin" ON public.profiles;
CREATE POLICY "Allow update for self or admin" ON public.profiles 
    FOR UPDATE TO authenticated USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Allow delete for self or admin" ON public.profiles;
CREATE POLICY "Allow delete for self or admin" ON public.profiles 
    FOR DELETE TO authenticated USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- User Dashboard Configs (Benutzerspezifisch abgesichert)
DROP POLICY IF EXISTS "Allow dashboard configs read for self" ON public.user_dashboard_configs;
CREATE POLICY "Allow dashboard configs read for self" ON public.user_dashboard_configs 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow dashboard configs insert for self" ON public.user_dashboard_configs;
CREATE POLICY "Allow dashboard configs insert for self" ON public.user_dashboard_configs 
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow dashboard configs update for self" ON public.user_dashboard_configs;
CREATE POLICY "Allow dashboard configs update for self" ON public.user_dashboard_configs 
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow dashboard configs delete for self" ON public.user_dashboard_configs;
CREATE POLICY "Allow dashboard configs delete for self" ON public.user_dashboard_configs 
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
