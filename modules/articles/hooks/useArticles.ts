"use client";

import { useState, useEffect, useCallback } from "react";
import { Article } from "../types";
import { articleService } from "../services/articleService";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await articleService.getArticles();
      setArticles(data);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Artikel.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime Update for all components using this hook
  useSupabaseRealtime('articles', fetchArticles);

  useEffect(() => {
    fetchArticles();
    // Reaktivität: Auf Änderungen im Service hören
    const unsubscribe = articleService.subscribe(() => {
      fetchArticles();
    });
    return () => unsubscribe();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles, setArticles };
}
