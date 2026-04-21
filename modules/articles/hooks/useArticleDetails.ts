"use client";

import { useState, useEffect, useCallback } from "react";
import { Article, ArticleHistoryEntry, ArticleComment } from "../types";
import { articleService } from "../services/articleService";

export function useArticleDetails(id: string) {
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
    try {
      setIsAdjusting(true);
      
      const currentStock = Number.isFinite(article.bestand) ? Number(article.bestand) : 0;
      const cleanAmount = Number.isFinite(amount) ? Number(amount) : 0;
      
      const finalAdjustment = type === 'output' ? -cleanAmount : cleanAmount;
      const calculatedNewStock = Math.max(0, currentStock + finalAdjustment);

      console.log("DEBUG_STOCK:", { id, currentStock, adjustment: finalAdjustment, target: calculatedNewStock });

      // 1. Haupt-Update
      await articleService.updateArticle(id, { bestand: calculatedNewStock });
      setArticle(prev => prev ? { ...prev, bestand: calculatedNewStock } : null);
      
      // 2. Historie loggen
      try {
        await articleService.addHistoryEntry(id, currentStock, calculatedNewStock, type, cleanAmount);
        const freshHistory = await articleService.getArticleHistory(id);
        setHistory(freshHistory);
      } catch (hErr) {
        console.warn("[Radical Fix] History logging failed:", hErr);
      }

    } catch (err: any) {
      console.error("Lagerbuchung fehlgeschlagen:", err);
      throw new Error(err.message || "Lagerbuchung fehlgeschlagen.");
    } finally {
      setIsAdjusting(false);
    }
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
