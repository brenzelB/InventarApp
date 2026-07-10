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
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex flex-col relative overflow-hidden transition-colors duration-300">
      <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-outline pb-4">
        <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
          <Zap className="w-3.5 h-3.5" />
        </div>
        [ SYS_BOOK_06 ] Express-Buchung
      </h3>
      
      <div className="flex-grow flex flex-col justify-between gap-4">
        {articlesLoading ? (
           <div className="h-10 bg-surface-2 animate-pulse rounded-element border border-outline" />
        ) : (
          <select 
            className="w-full text-xs font-bold font-mono rounded-element border border-outline py-2.5 px-4 text-foreground bg-surface-0 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-foreground/40 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
            value={selectedArticleId}
            onChange={(e) => {
              setSelectedArticleId(e.target.value);
              setSuccess(false);
            }}
            disabled={loading}
          >
            <option value="" className="bg-widget">-- Artikel wählen --</option>
            {articles.map(a => (
              <option key={a.id} value={a.id} className="bg-widget">
                {a.sku} | {a.name} ({a.bestand} {a.unit || 'Stk'})
              </option>
            ))}
          </select>
        )}

        <div>
          <p className="text-[9px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-1.5 ml-1">Menge</p>
          <input
            type="number"
            step="any"
            min="0.01"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full text-xs font-bold font-mono rounded-element border border-outline py-2.5 px-4 text-foreground bg-surface-0 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-foreground/40"
            disabled={loading || !selectedArticleId}
            placeholder="Menge..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => handleAction('input')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-element text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" /> Einlagern
          </button>
          
          <button
            onClick={() => handleAction('output')}
            disabled={loading || !selectedArticleId || amount <= 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-element text-[10px] font-bold font-mono uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Minus className="w-3.5 h-3.5" /> Auslagern
          </button>
        </div>

        {/* Success Overlay */}
        <div className={`absolute inset-0 bg-widget/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none ${success ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-element flex items-center justify-center mb-4">
            <Check className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold font-mono text-emerald-500 uppercase tracking-widest">Buchung erfolgreich!</p>
        </div>

        {loading && !success && (
          <div className="absolute inset-0 bg-widget/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
