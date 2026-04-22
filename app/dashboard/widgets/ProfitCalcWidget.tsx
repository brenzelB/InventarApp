"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Calculator, TrendingUp } from "lucide-react";

export function ProfitCalcWidget() {
  const { articles, loading } = useArticles();

  const stats = useMemo(() => {
    if (!articles || articles.length === 0) return { buy: 0, sell: 0, profit: 0 };
    
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

    return { buy: totalBuy, sell: totalSell, profit: totalSell - totalBuy };
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-widget rounded-3xl p-8 shadow animate-pulse flex items-center justify-center">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-100 flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
          <Calculator className="w-4 h-4 text-blue-500" />
        </div>
        Gewinn-Kalkulation
      </h3>
      
      <div className="flex-1 flex gap-8 items-center">
        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
          <div className="pr-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">
              Abzug-Aktionen (Netto)
            </p>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
              -{stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
            </div>
          </div>
          
          <div className="pl-6 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">
              Zuzug-Aktionen (Netto)
            </p>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
              +{stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md dark:shadow-[0_8px_30px_rgb(59,130,246,0.2)] dark:ring-1 dark:ring-blue-500/20 hover:dark:shadow-[0_8px_30px_rgb(59,130,246,0.4)]">
            Profit
          </button>
        </div>
      </div>
    </div>
  );
}
