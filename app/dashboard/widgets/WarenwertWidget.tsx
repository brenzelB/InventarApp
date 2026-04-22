"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Coins, TrendingUp } from "lucide-react";

export function WarenwertWidget() {
  const { articles, loading } = useArticles();

  const stats = useMemo(() => {
    if (!articles || articles.length === 0) return { buy: 0, sell: 0 };
    
    let totalBuy = 0;
    let totalSell = 0;

    articles.forEach((item) => {
      const quantity = Number(item.bestand) || 0;
      const grossBuy = Number(item.purchase_price || 0) * quantity;
      const grossSell = Number(item.verkaufspreis || 0) * quantity;
      const taxRate = Number(item.tax_rate !== undefined ? item.tax_rate : 19);

      const netBuy = grossBuy / (1 + (taxRate / 100));
      const netSell = grossSell / (1 + (taxRate / 100));

      totalBuy += netBuy;
      totalSell += netSell;
    });

    return { buy: totalBuy, sell: totalSell };
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-widget rounded-3xl p-8 shadow animate-pulse flex items-center justify-center">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-widget rounded-3xl p-8 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
          <Coins className="w-4 h-4 text-blue-500" />
        </div>
        Warenwert
      </h3>
      
      <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
        <div className="pr-6 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">
            Bestandswert (Netto-EK)
          </p>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
            -{stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
        </div>
        
        <div className="pl-6 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">
            Warenwert (Netto-VK)
          </p>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
            +{stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
        </div>
      </div>
    </div>
  );
}
