"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Banknote, TrendingUp } from "lucide-react";

export function InventoryValueWidget() {
  const { articles, loading } = useArticles();

  const totalValue = useMemo(() => {
    if (!articles) return 0;
    return articles.reduce((sum, item) => {
      const quantity = Number(item.bestand) || 0;
      const price = Number(item.purchase_price) || 0;
      return sum + (quantity * price);
    }, 0);
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow flex flex-col justify-center animate-pulse">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-indigo-700 dark:from-indigo-800 dark:to-indigo-950 rounded-xl p-6 shadow-xl relative overflow-hidden group">
      <h3 className="text-sm font-bold text-indigo-100 flex items-center gap-2 mb-2 relative z-10 uppercase tracking-widest">
        <Banknote className="w-4 h-4" />
        Kapitalbindung
      </h3>
      
      <div className="flex-1 flex flex-col justify-center relative z-10 h-full">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xl font-bold text-indigo-200">€</span>
        </div>
        <p className="text-xs text-indigo-200 mt-2 font-medium">Gesamtwert (Bestand × Einkaufspreis)</p>
      </div>

      <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
    </div>
  );
}
