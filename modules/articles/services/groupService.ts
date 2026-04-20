import { supabase, isMockMode } from "@/lib/supabaseClient";
import { Group } from "../types";

const STORAGE_KEY = "mock_groups";

function getMockGroups(): Group[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMockGroups(groups: Group[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function generateId(): string {
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const groupService = {
  async getGroups(): Promise<Group[]> {
    if (isMockMode) {
      return getMockGroups();
    }
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createGroup(name: string): Promise<Group> {
    if (isMockMode) {
      const groups = getMockGroups();
      const newGroup: Group = {
        id: generateId(),
        name,
        created_at: new Date().toISOString(),
      };
      groups.push(newGroup);
      saveMockGroups(groups);
      return newGroup;
    }
    
    // Get current user id for user_id field
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("groups")
      .insert([{ name, user_id: user?.id }])
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async updateGroup(id: string, name: string): Promise<Group> {
    if (isMockMode) {
      const groups = getMockGroups();
      const index = groups.findIndex(g => g.id === id);
      if (index === -1) throw new Error("Gruppe nicht gefunden.");
      groups[index] = { ...groups[index], name };
      saveMockGroups(groups);
      return groups[index];
    }
    const { data, error } = await supabase
      .from("groups")
      .update({ name })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGroup(id: string): Promise<void> {
    if (isMockMode) {
      const groups = getMockGroups().filter(g => g.id !== id);
      saveMockGroups(groups);
      return;
    }
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
