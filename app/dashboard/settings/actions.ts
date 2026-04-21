"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export type SettingKey = 'app_name' | 'default_unit' | 'warning_threshold';

/**
 * Loads all settings from the database and returns them as a key-value object.
 */
export async function getSettings() {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('*');
    
    if (error) {
      console.error("[Settings] Fetch error:", error.message);
      return { success: false, error: error.message };
    }

    const settingsMap = (data || []).reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    return { success: true, settings: settingsMap };
  } catch (err: any) {
    return { success: false, error: "Fehler beim Laden der Einstellungen." };
  }
}

/**
 * Upserts a single setting key-value pair.
 */
export async function updateSetting(key: string, value: string) {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      console.error("[Settings] Update error:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Fehler beim Speichern." };
  }
}

/**
 * Destructive action to clear the entire articles table.
 */
export async function deleteAllArticles() {
  try {
    // Delete all articles (using uuid format for safety check or just blank eq)
    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .not('id', 'is', null); // Effectively "match everything"

    if (error) {
      console.error("[Settings] Bulk delete error:", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/articles');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Ein Fehler beim Löschen der Daten ist aufgetreten." };
  }
}
