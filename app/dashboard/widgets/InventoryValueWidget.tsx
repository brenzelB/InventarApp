"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Banknote, Coins, TrendingUp, ArrowUpRight } from "lucide-react";

export function InventoryValueWidget() {
  const { articles, loading } = useArticles();

  const stats = useMemo(() => {
    if (!articles) return { buy: 0, sell: 0, profit: 0 };
    
    const buy = articles.reduce((sum, item) => {
      const quantity = Number(item.bestand) || 0;
      const price = Number(item.purchase_price || 0);
      return sum + (quantity * price);
    }, 0);

    const sell = articles.reduce((sum, item) => {
      const quantity = Number(item.bestand) || 0;
      const price = Number(item.verkaufspreis || 0);
      return sum + (quantity * price);
    }, 0);

    return {
      buy,
      sell,
      profit: sell - buy
    };
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-center animate-pulse gap-4">
        <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
          <Coins className="w-4 h-4 text-indigo-500" />
          Finanz-Übersicht
        </h3>
        <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5">
          <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
            {stats.profit.toLocaleString('de-DE', { minimumFractionDigits: 0 })} € Ertrag
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purchase Value Section */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1 italic opacity-80">Kapitalbindung (EK)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-indigo-200">€</span>
            </div>
          </div>
          <Banknote className="absolute -bottom-2 -right-2 w-12 h-12 text-white opacity-10 group-hover:scale-125 transition-transform" />
        </div>

        {/* Sales Value Section */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
          <div>
            <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1 italic opacity-80">Warenwert (VK)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tracking-tight">
                {stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-emerald-200">€</span>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-2 -right-2 w-12 h-12 text-white opacity-10 group-hover:scale-125 transition-transform" />
        </div>
      </div>
    </div>
  );
}
