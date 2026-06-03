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
      <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-outline rounded-element"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex flex-col transition-colors duration-300">
      <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-outline pb-4">
        <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
          <Coins className="w-3.5 h-3.5" />
        </div>
        [ SYS_VAL_08 ] Warenwert
      </h3>
      
      <div className="flex-grow grid grid-cols-2 divide-x divide-outline">
        <div className="pr-4 flex flex-col justify-center bg-grid-pattern bg-opacity-5">
          <p className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest mb-1.5">
            Bestand EK (Net)
          </p>
          <div className="text-lg font-bold text-red-500 font-mono tracking-tight">
            -{stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>
        
        <div className="pl-4 flex flex-col justify-center bg-grid-pattern bg-opacity-5">
          <p className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest mb-1.5">
            Waren VK (Net)
          </p>
          <div className="text-lg font-bold text-emerald-500 font-mono tracking-tight">
            +{stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>
      </div>
    </div>
  );
}
