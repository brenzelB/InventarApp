import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('Fehlende Umgebungsvariable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.warn('Fehlende Umgebungsvariable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const isMockMode = !supabaseUrl || supabaseUrl.includes('dummy') || supabaseUrl.includes('placeholder');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
