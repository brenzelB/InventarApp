"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function saveDashboardLayout(userId: string, layout: any) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .upsert({ user_id: userId, layout }, { onConflict: 'user_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[Dashboard] Initial Save Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getDashboardLayout(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt.', layout: null };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .select('layout')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }
    
    return { success: true, layout: data?.layout || null };
  } catch (err: any) {
    console.error("[Dashboard] Load Error:", err);
    return { success: false, error: err.message, layout: null };
  }
}

export async function saveArticleGridConfig(userId: string, config: any) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .upsert({ 
        user_id: userId, 
        article_grid_config: config,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("[GridConfig] Save Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getArticleGridConfig(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service Role Key fehlt.', config: null };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .select('article_grid_config')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return { success: true, config: data?.article_grid_config || null };
  } catch (err: any) {
    console.error("[GridConfig] Load Error:", err);
    return { success: false, error: err.message, config: null };
  }
}
