import { supabase, isMockMode } from "@/lib/supabaseClient";
import { Article, ArticleFormData, ArticleHistoryEntry, ArticleComment, HistoryType } from "../types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
async function fetchQrFromApi(articleId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/articles/qr/${articleId}`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────
export const articleService = {
  async getArticles() {
    if (isMockMode) {
      return getMockArticles();
    }
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Article[];
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
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Article;
  },

  async createArticle(article: ArticleFormData) {
    if (isMockMode) {
      const now = new Date().toISOString();
      const id = generateId();

      // QR-Code über API-Route generieren
      const qr_code = await fetchQrFromApi(id);

      const newArticle: Article = {
        ...article,
        id,
        qr_code,
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
      .select()
      .single();

    if (insertError) throw insertError;
    const createdArticle = initialData as Article;

    // QR Code über API-Route abrufen (generiert & speichert automatisch)
    await fetchQrFromApi(createdArticle.id);

    // Artikel erneut laden um gespeicherten QR-Code zu erhalten
    try {
      const { data: updated } = await supabase
        .from("articles")
        .select("*")
        .eq("id", createdArticle.id)
        .single();
      return (updated ?? createdArticle) as Article;
    } catch {
      return createdArticle;
    }
  },

  async updateArticle(id: string, article: Partial<ArticleFormData>) {
    if (isMockMode) {
      const articles = getMockArticles();
      const index = articles.findIndex((a) => a.id === id);
      if (index === -1) throw new Error(`Artikel mit ID ${id} nicht gefunden.`);
      articles[index] = {
        ...articles[index],
        ...article,
        updated_at: new Date().toISOString(),
      };
      saveMockArticles(articles);
      return articles[index];
    }

    // Daten-Sanierung für Supabase (Ganzzahlen sicherstellen)
    const updateData = { ...article };
    if (updateData.bestand !== undefined) updateData.bestand = Math.floor(updateData.bestand);
    if (updateData.mindestbestand !== undefined) updateData.mindestbestand = Math.floor(updateData.mindestbestand);

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Article;
  },

  async deleteArticle(id: string) {
    if (isMockMode) {
      const articles = getMockArticles().filter((a) => a.id !== id);
      saveMockArticles(articles);
      // Auch History und Kommentare löschen
      localStorage.removeItem(`mock_history_${id}`);
      localStorage.removeItem(`mock_comments_${id}`);
      return;
    }
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) throw error;
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

    // Finaler Radical Fix für Not-Null Constraint
    const safeOldStock = Number.isFinite(old_stock) ? Math.floor(old_stock) : 0;
    const safeNewStock = Number.isFinite(new_stock) ? Math.floor(new_stock) : safeOldStock;

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

  /**
   * Backfill: Ruft die Server-API auf, um alle Artikel ohne QR-Code nachzuversorgen.
   * Für Mock-Modus: QR-Codes werden über die API-Route generiert und lokal gespeichert.
   */
  async backfillMissingQrCodes(): Promise<{ updated: number; message: string }> {
    if (isMockMode) {
      const articles = getMockArticles();
      const missing = articles.filter((a) => !a.qr_code);
      let updated = 0;

      for (const article of missing) {
        const qr_code = await fetchQrFromApi(article.id);
        if (qr_code) {
          article.qr_code = qr_code;
          updated++;
        }
      }
      if (updated > 0) saveMockArticles(articles);
      return { updated, message: `${updated} Mock-Artikel aktualisiert.` };
    }

    // Supabase: Server-side API Route aufrufen
    try {
      const response = await fetch("/api/articles/backfill-qr", { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Backfill fehlgeschlagen");
      }
      return await response.json();
    } catch (e: any) {
      console.error("Backfill QR codes failed:", e);
      return { updated: 0, message: e.message || "Fehler beim Backfill" };
    }
  },
};
