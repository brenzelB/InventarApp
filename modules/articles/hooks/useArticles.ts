"use client";

import { useState, useEffect, useCallback } from "react";
import { Article } from "../types";
import { articleService } from "../services/articleService";

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

      // Backfill im Hintergrund: Artikel ohne QR-Code in Supabase nachgenerieren
      const missing = data.filter((a) => !a.qr_code);
      if (missing.length > 0) {
        articleService.backfillMissingQrCodes().then((result) => {
          if (result.updated > 0) {
            // Neu laden damit die gespeicherten QR-Codes erscheinen
            articleService
              .getArticles()
              .then((fresh) => setArticles(fresh))
              .catch(() => {});
          }
        });
      }
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Artikel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles, setArticles };
}
