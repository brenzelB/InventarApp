import { supabase, isMockMode } from "@/lib/supabaseClient";
import { Article, ArticleFormData, ArticleHistoryEntry, ArticleComment, HistoryType } from "../types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// ──────────────────────────────────────────────────────────────
// Mock-Speicher (localStorage) für den Demo-Modus
// ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "mock_articles";

function getMockArticles(): Article[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMockArticles(articles: Article[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

function generateId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generiert einen QR-Code serverseitig über die API-Route.
 * Gibt den SVG-String zurück oder null bei Fehler.
 */
async function fetchQrFromApi(articleId: string, origin?: string): Promise<string | null> {
  try {
    const url = origin 
      ? `/api/articles/qr/${articleId}?origin=${encodeURIComponent(origin)}` 
      : `/api/articles/qr/${articleId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Service mit einfacher Reaktivität (Observer-Pattern)
// ──────────────────────────────────────────────────────────────
type ArticleChangeListener = () => void;
let listeners: ArticleChangeListener[] = [];

export const articleService = {
  subscribe(listener: ArticleChangeListener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  notify() {
    console.log("[ArticleService] Notifying subscribers of change...");
    listeners.forEach(l => l());
  },

  async getArticles() {
    if (isMockMode) {
      return getMockArticles();
    }
    const { data, error } = await supabase
      .from("articles")
      .select("id, name, sku, description, herstellpreis, verkaufspreis, purchase_price, bestand, mindestbestand, unit, lagerort, qr_code, group_id, created_at, updated_at, group:groups(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as any) as Article[];
  },

  async getArticleById(id: string) {
    if (isMockMode) {
      const articles = getMockArticles();
      const article = articles.find((a) => a.id === id);
      if (!article) throw new Error(`Artikel mit ID ${id} nicht gefunden.`);
      return article;
    }
    const { data, error } = await supabase
      .from("articles")
      .select("*, group:groups(name)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Article;
  },

  async createArticle(article: ArticleFormData) {
    if (isMockMode) {
      const now = new Date().toISOString();
      const id = generateId();

      // For mock mode, try to fetch group name if group_id is present
      const groups = JSON.parse(localStorage.getItem("mock_groups") || "[]");
      const groupData = article.group_id ? groups.find((g: any) => g.id === article.group_id) : null;

      // QR-Code über API-Route generieren
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const qr_code = await fetchQrFromApi(id, origin);

      const newArticle: Article = {
        ...article,
        id,
        qr_code,
        group_id: article.group_id ?? null,
        group: groupData ? { name: groupData.name } : null,
        created_at: now,
        updated_at: now,
      };
      const articles = getMockArticles();
      articles.unshift(newArticle);
      saveMockArticles(articles);
      return newArticle;
    }

    // Supabase: Erst einfügen, dann QR mit der echten ID generieren
    const { data: initialData, error: insertError } = await supabase
      .from("articles")
      .insert([article])
      .select("*, group:groups(name)")
      .single();

    if (insertError) throw insertError;
    const createdArticle = initialData as Article;

    // QR Code über API-Route abrufen (generiert & speichert automatisch mit fester Domain)
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    await fetchQrFromApi(createdArticle.id, origin);

    // Artikel erneut laden um gespeicherten QR-Code zu erhalten
    try {
      const { data: updated } = await supabase
        .from("articles")
        .select("*, group:groups(name)")
        .eq("id", createdArticle.id)
        .single();
      const finalArticle = (updated ?? createdArticle) as Article;
      this.notify();
      return finalArticle;
    } catch {
      this.notify();
      return createdArticle;
    }
  },

  async updateArticle(id: string, article: Partial<ArticleFormData>) {
    if (isMockMode) {
      const articles = getMockArticles();
      const index = articles.findIndex((a) => a.id === id);
      if (index === -1) throw new Error(`Artikel mit ID ${id} nicht gefunden.`);
      
      const groups = JSON.parse(localStorage.getItem("mock_groups") || "[]");
      const group_id = article.group_id !== undefined ? article.group_id : articles[index].group_id;
      const groupData = group_id ? groups.find((g: any) => g.id === group_id) : null;

      articles[index] = {
        ...articles[index],
        ...article,
        group: groupData ? { name: groupData.name } : null,
        updated_at: new Date().toISOString(),
      };
      saveMockArticles(articles);
      this.notify();
      return articles[index];
    }

    // Daten-Sanierung für Supabase
    const updateData = { ...article };
    // Math.floor ENTFERNT für Kommazahlen-Unterstützung

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select("*, group:groups(name)")
      .single();
    if (error) throw error;
    this.notify();
    return data as Article;
  },

  async deleteArticle(id: string) {
    if (isMockMode) {
      const articles = getMockArticles().filter((a) => a.id !== id);
      saveMockArticles(articles);
      // Auch History und Kommentare löschen
      localStorage.removeItem(`mock_history_${id}`);
      localStorage.removeItem(`mock_comments_${id}`);
      this.notify();
      return;
    }
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) throw error;
    this.notify();
  },

  async updateArticlesGroup(articleIds: string[], groupId: string | null) {
    if (isMockMode) {
      const articles = getMockArticles();
      const groups = JSON.parse(localStorage.getItem("mock_groups") || "[]");
      const groupData = groupId ? groups.find((g: any) => g.id === groupId) : null;

      const updatedArticles = articles.map(art => {
        if (articleIds.includes(art.id)) {
          return {
            ...art,
            group_id: groupId,
            group: groupData ? { name: groupData.name } : null,
            updated_at: new Date().toISOString()
          };
        }
        return art;
      });
      saveMockArticles(updatedArticles);
      this.notify();
      return;
    }

    const { error } = await supabase
      .from("articles")
      .update({ group_id: groupId })
      .in("id", articleIds);
    if (error) throw error;
    this.notify();
  },

  // ──────────────────────────────────────────────────────────────
  // History & Kommentare
  // ──────────────────────────────────────────────────────────────

  async getArticleHistory(articleId: string): Promise<ArticleHistoryEntry[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem(`mock_history_${articleId}`) || "[]");
    }
    const { data, error } = await supabase
      .from("article_history")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getRecentHistory(limit: number = 5): Promise<(ArticleHistoryEntry & { article?: { name: string } })[]> {
    if (isMockMode) {
      let allHistory: any[] = [];
      const articles = getMockArticles();
      articles.forEach(a => {
        const h = JSON.parse(localStorage.getItem(`mock_history_${a.id}`) || "[]");
        allHistory = [...allHistory, ...h.map((entry: any) => ({ ...entry, article: { name: a.name } }))];
      });
      allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return allHistory.slice(0, limit);
    }
    
    const { data, error } = await supabase
      .from("article_history")
      .select("*, article:articles(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }

    return data || [];
  },

  async getHistoryTrend(days: number = 7): Promise<{ created_at: string; amount: number; type: HistoryType }[]> {
    if (isMockMode) {
      // Basic mock implementation for trend
      const allHistory = await this.getRecentHistory(100);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      return allHistory.filter(h => new Date(h.created_at) >= limitDate).map(h => ({
        created_at: h.created_at,
        amount: (h as any).amount || 1, // Fallback if mock amount is missing
        type: h.type
      }));
    }

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);

    const { data, error } = await supabase
      .from("article_history")
      .select("created_at, amount, type")
      .gte("created_at", limitDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as any[];
  },

  async addHistoryEntry(articleId: string, old_stock: number, new_stock: number, type: HistoryType, amount: number) {
    if (isMockMode) {
      const history = await this.getArticleHistory(articleId);
      const newEntry: ArticleHistoryEntry & { amount: number } = {
        id: generateId(),
        article_id: articleId,
        old_stock: old_stock,
        new_stock: new_stock,
        amount: amount,
        type: type,
        created_at: new Date().toISOString(),
      };
      history.unshift(newEntry);
      localStorage.setItem(`mock_history_${articleId}`, JSON.stringify(history));
      return newEntry;
    }

    // Secondary Safety Check
    if (!Number.isFinite(new_stock)) {
      console.error("[Service] Attempted to log history with invalid new_stock:", new_stock);
      throw new Error("Ungültiger Bestandswert für die Historie.");
    }

    // Präzision beibehalten für Kommazahlen
    const safeOldStock = Number.isFinite(old_stock) ? old_stock : 0;
    const safeNewStock = Number.isFinite(new_stock) ? new_stock : safeOldStock;

    const { data, error } = await supabase
      .from("article_history")
      .insert([
        { 
          article_id: articleId, 
          old_stock: safeOldStock, 
          new_stock: safeNewStock, 
          type: type, 
          amount: Number.isFinite(amount) ? amount : 0
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getComments(articleId: string): Promise<ArticleComment[]> {
    if (isMockMode) {
      return JSON.parse(localStorage.getItem(`mock_comments_${articleId}`) || "[]");
    }
    const { data, error } = await supabase
      .from("article_comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async addComment(articleId: string, content: string) {
    if (isMockMode) {
      const comments = await this.getComments(articleId);
      const newComment: import("../types").ArticleComment = {
        id: generateId(),
        article_id: articleId,
        content,
        created_at: new Date().toISOString(),
      };
      comments.unshift(newComment);
      localStorage.setItem(`mock_comments_${articleId}`, JSON.stringify(comments));
      return newComment;
    }
    const { data, error } = await supabase
      .from("article_comments")
      .insert([{ article_id: articleId, content }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
