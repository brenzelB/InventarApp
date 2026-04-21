"use client";

import { useState } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Zap, Plus, Minus, Check, Loader2 } from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";

export function QuickBookWidget() {
  const { articles, loading: articlesLoading, refetch } = useArticles();
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAction = async (type: 'input' | 'output') => {
    if (!selectedArticleId || !amount || amount <= 0) return;
    const article = articles.find(a => a.id === selectedArticleId);
    if (!article) return;

    setLoading(true);
    setSuccess(false);

    try {
      const currentStock = Number.isFinite(article.bestand) ? Number(article.bestand) : 0;
      const cleanAmount = Number.isFinite(amount) ? Number(amount) : 0;
      
      const finalAmount = type === 'output' ? -Math.abs(cleanAmount) : Math.abs(cleanAmount);
      const calculatedNewStock = currentStock + finalAmount;

      await articleService.updateArticle(article.id, { bestand: calculatedNewStock });
      await articleService.addHistoryEntry(article.id, currentStock, calculatedNewStock, type, finalAmount);
      
      // Update local state implicitly via SWR
      await refetch();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setAmount(1);
    } catch (err) {
      console.error("Booking failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col relative overflow-hidden">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-500" />
        Express-Buchung
      </h3>
      
      <div className="flex-1 flex flex-col gap-4">
        {articlesLoading ? (
           <div className="h-10 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />
        ) : (
          <select 
            className="w-full text-sm rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
            value={selectedArticleId}
            onChange={(e) => {
              setSelectedArticleId(e.target.value);
              setSuccess(false);
            }}
            disabled={loading}
          >
            <option value="">-- Artikel wählen --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id}>
                {a.sku} | {a.name} ({a.bestand} {a.unit || 'Stk'})
              </option>
            ))}
          </select>
        )}

        <div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full text-sm rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600"
            disabled={loading || !selectedArticleId}
            placeholder="Menge..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => handleAction('input')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" /> Einlagern
          </button>
          
          <button
            onClick={() => handleAction('output')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-1 py-2.5 rounded-lg text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          >
            <Minus className="w-3 h-3" /> Auslagern
          </button>
        </div>

        {/* Success Overlay */}
        <div className={`absolute inset-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none ${success ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-2">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-green-700 dark:text-green-400">Gebucht!</p>
        </div>

        {loading && !success && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
