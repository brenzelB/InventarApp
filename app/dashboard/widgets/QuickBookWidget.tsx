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
      const absAmount = Math.abs(amount);
      
      const calculatedNewStock = type === 'output' 
        ? Math.max(0, currentStock - absAmount) 
        : currentStock + absAmount;

      console.log("BERECHNETER BESTAND FÜR DB (WIDGET):", calculatedNewStock);
      console.log("[QuickBook] Adjustment:", { article: article.name, currentStock, originalAmount: amount, absAmount, type, result: calculatedNewStock });

      await articleService.updateArticle(article.id, { bestand: calculatedNewStock });
      const signedAmount = type === 'output' ? -absAmount : absAmount;
      await articleService.addHistoryEntry(article.id, currentStock, calculatedNewStock, type, signedAmount);
      
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
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col relative overflow-hidden">
      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6 uppercase tracking-widest">
        <Zap className="w-4 h-4 text-amber-500" />
        Express-Buchung
      </h3>
      
      <div className="flex-1 flex flex-col gap-8">
        {articlesLoading ? (
           <div className="h-10 bg-slate-100 animate-pulse rounded-2xl" />
        ) : (
          <select 
            className="w-full text-sm font-bold rounded-2xl border-0 py-2.5 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-accent appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
            value={selectedArticleId}
            onChange={(e) => {
              setSelectedArticleId(e.target.value);
              setSuccess(false);
            }}
            disabled={loading}
          >
            <option value="" className="dark:bg-slate-900">-- Artikel wählen --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id} className="dark:bg-slate-900">
                {a.sku} | {a.name} ({a.bestand} {a.unit || 'Stk'})
              </option>
            ))}
          </select>
        )}

        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Menge</p>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full text-sm font-bold rounded-2xl border-0 py-2.5 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-accent placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={loading || !selectedArticleId}
            placeholder="Menge..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => handleAction('input')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 ring-1 ring-emerald-600/10 dark:ring-emerald-400/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Einlagern
          </button>
          
          <button
            onClick={() => handleAction('output')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 ring-1 ring-rose-600/10 dark:ring-rose-400/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Minus className="w-4 h-4" /> Auslagern
          </button>
        </div>

        {/* Success Overlay */}
        <div className={`absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none ${success ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 shadow-sm dark:shadow-none ring-1 ring-emerald-200 dark:ring-emerald-800">
            <Check className="w-8 h-8" />
          </div>
          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Buchung erfolgreich!</p>
        </div>

        {loading && !success && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
