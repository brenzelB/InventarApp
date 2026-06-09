"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Article, ArticleHistoryEntry, ArticleComment } from "../types";
import { articleService } from "../services/articleService";

export function useArticleDetails(id: string) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [history, setHistory] = useState<ArticleHistoryEntry[]>([]);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load the article first (critical)
      const articleData = await articleService.getArticleById(id);
      setArticle(articleData);

      // Load history and comments (non-critical, might fail if tables missing)
      try {
        const historyData = await articleService.getArticleHistory(id);
        setHistory(historyData);
      } catch (hErr) {
        console.warn("History could not be loaded:", hErr);
      }

      try {
        const commentsData = await articleService.getComments(id);
        setComments(commentsData);
      } catch (cErr) {
        console.warn("Comments could not be loaded:", cErr);
      }

    } catch (err: any) {
      setError(err.message || "Fehler beim Laden des Artikels.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const addComment = async (content: string) => {
    try {
      const newComment = await articleService.addComment(id, content);
      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err: any) {
      throw new Error(err.message || "Kommentar konnte nicht gespeichert werden.");
    }
  };

  const adjustStock = async (amount: number, type: 'input' | 'output') => {
    if (!article) return;
    
    const currentStock = Number.isFinite(article.bestand) ? Number(article.bestand) : 0;
    const absAmount = Math.abs(amount);
    
    const calculatedNewStock = type === 'output' 
      ? Math.max(0, currentStock - absAmount) 
      : currentStock + absAmount;

    console.log("BERECHNETER BESTAND FÜR DB (OPTIMISTISCH):", calculatedNewStock);
    console.log("DEBUG_STOCK:", { id, currentStock, originalAmount: amount, absAmount, type, target: calculatedNewStock });

    // Speichere den vorherigen Zustand für einen eventuellen Rollback bei Fehler des Haupt-Updates
    const previousArticle = { ...article };
    const previousHistory = [...history];

    // 1. Optimistisches Update für den Artikel-Bestand
    setArticle(prev => prev ? { ...prev, bestand: calculatedNewStock } : null);

    // 2. Optimistisches Update für die Historien-Liste
    const signedAmount = type === 'output' ? -absAmount : absAmount;
    const optimisticHistoryEntry: ArticleHistoryEntry = {
      id: `temp-${Date.now()}`,
      article_id: id,
      old_stock: currentStock,
      new_stock: calculatedNewStock,
      amount: signedAmount,
      type: type,
      created_at: new Date().toISOString()
    };
    setHistory(prev => [optimisticHistoryEntry, ...prev]);

    // DB-Operationen asynchron im Hintergrund ausführen (kein await hier, um UI nicht zu blockieren)
    (async () => {
      let updateSuccess = false;
      try {
        setIsAdjusting(true);
        // Haupt-Update in der Datenbank
        await articleService.updateArticle(id, { bestand: calculatedNewStock });
        updateSuccess = true;
        
        // Refresh Next.js caches
        router.refresh();
      } catch (err: any) {
        console.error("Haupt-Lagerbuchung fehlgeschlagen, führe Rollback aus:", err);
        // Rollback NUR bei Fehler des Haupt-Updates
        setArticle(previousArticle);
        setHistory(previousHistory);
        setIsAdjusting(false);
        return;
      }

      // Historie & Logs getrennt behandeln, damit Fehler hierbei die Buchung in der UI nicht rückgängig machen
      try {
        await articleService.addHistoryEntry(id, currentStock, calculatedNewStock, type, signedAmount);
        const freshHistory = await articleService.getArticleHistory(id);
        setHistory(freshHistory);
      } catch (hErr) {
        console.warn("Historie-Logging im Hintergrund fehlgeschlagen (UI-Update bleibt erhalten):", hErr);
      } finally {
        setIsAdjusting(false);
      }
    })();
  };

  const updateArticle = async (data: Partial<import("../types").ArticleFormData>) => {
    if (!article) return;
    try {
      setIsAdjusting(true);
      const oldBestand = article.bestand;
      const newBestand = data.bestand !== undefined ? data.bestand : oldBestand;

      const updated = await articleService.updateArticle(id, data);
      setArticle(updated);

      // Log history if stock changed manually during edit
      if (oldBestand !== newBestand) {
        const amount = newBestand - oldBestand;
        await articleService.addHistoryEntry(id, oldBestand, newBestand, amount > 0 ? 'input' : 'output', amount);
        const freshHistory = await articleService.getArticleHistory(id);
        setHistory(freshHistory);
      }
      
      return updated;
    } catch (err: any) {
      throw new Error(err.message || "Fehler beim Aktualisieren des Artikels.");
    } finally {
      setIsAdjusting(false);
    }
  };

  return { 
    article, 
    history, 
    comments, 
    loading, 
    isAdjusting,
    error, 
    refetch: fetchDetails,
    addComment,
    adjustStock,
    updateArticle
  };
}
