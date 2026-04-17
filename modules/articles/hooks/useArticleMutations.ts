"use client";
import { useState } from 'react';
import { articleService } from '../services/articleService';
import { ArticleFormData } from '../types';

export function useArticleMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMutation = async <T,>(mutationFn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const result = await mutationFn();
      console.log("[Mutation] Successful result:", result);
      return result;
    } catch (err: any) {
      console.error("[Mutation] Final caught error:", err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const create = async (data: ArticleFormData) => handleMutation(() => articleService.createArticle(data));
  const update = async (id: string, data: Partial<ArticleFormData>) => handleMutation(() => articleService.updateArticle(id, data));
  const remove = async (id: string) => handleMutation(() => articleService.deleteArticle(id));

  return { create, update, remove, loading, error };
}
