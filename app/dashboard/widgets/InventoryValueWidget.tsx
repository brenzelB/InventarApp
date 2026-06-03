"use client";

import { useMemo, useState, useEffect } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Lock, Tag, Coins, ArrowUpRight, Percent } from "lucide-react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";


export const InventoryValueWidget = ({ config, onUpdateConfig }: { config: any, onUpdateConfig: (settings: any) => void }) => {
  const { articles, loading, refetch } = useArticles();
  const [isPulsing, setIsPulsing] = useState(false);
  const [isNetView, setIsNetView] = useState(config?.isNetto ?? false);

  // Sync state with config if it changes externally
  useEffect(() => {
    if (config?.isNetto !== undefined && config.isNetto !== isNetView) {
      setIsNetView(config.isNetto);
    }
  }, [config?.isNetto]);

  useSupabaseRealtime('articles', () => {
    refetch();
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1500);
  });

  const handleToggleNetto = (val: boolean) => {
    console.log("🔄 Toggle geklickt! Neuer Modus:", val ? "NETTO" : "BRUTTO");
    setIsNetView(val);
    onUpdateConfig({ isNetto: val });
    
    // Trigger Feedback Animation jump effect
    setIsPulsing(false);
    setTimeout(() => setIsPulsing(true), 10);
    setTimeout(() => setIsPulsing(false), 1500);
  };

  const stats = useMemo(() => {
    if (!articles || articles.length === 0) return { buy: 0, sell: 0, profit: 0, margin: 0, vat: 0 };
    
    console.log("[InventoryValueWidget] Recalculating stats. Mode:", isNetView ? "NETTO" : "BRUTTO", "Articles:", articles.length);
    
    let totalBuy = 0;
    let totalSell = 0;
    let totalVat = 0;

    articles.forEach((item, index) => {
      const quantity = Number(item.bestand) || 0;
      const grossBuy = Number(item.purchase_price || 0) * quantity;
      const grossSell = Number(item.verkaufspreis || 0) * quantity;
      const taxRate = Number(item.tax_rate !== undefined ? item.tax_rate : 19);

      if (index === 0) {
        console.log(`[Debug] Article[0]: ${item.name}, Tax: ${taxRate}%, GrossEK: ${grossBuy}, GrossVK: ${grossSell}`);
      }

      const netBuy = grossBuy / (1 + (taxRate / 100));
      const netSell = grossSell / (1 + (taxRate / 100));

      if (isNetView) {
        totalBuy += netBuy;
        totalSell += netSell;
      } else {
        totalBuy += grossBuy;
        totalSell += grossSell;
      }

      // Gebundene Umsatzsteuer is the difference between Gross and Net Sales Value
      totalVat += (grossSell - netSell);
    });

    const profit = totalSell - totalBuy;
    const margin = totalSell > 0 ? (profit / totalSell) * 100 : 0;

    return { buy: totalBuy, sell: totalSell, profit, margin, vat: totalVat };
  }, [articles, isNetView]);

  const buyRatio = stats.sell > 0 ? (stats.buy / stats.sell) * 100 : 0;
  const profitRatio = stats.sell > 0 ? (stats.profit / stats.sell) * 100 : 0;

  if (loading) {
    return (
      <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-outline rounded-element"></div>
      </div>
    );
  }
  return (
    <div className="h-full w-full bg-widget border border-outline rounded-card flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Header with Toggle */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-outline">
        <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
          <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
            <Coins className="w-3.5 h-3.5" />
          </div>
          [ SYS_FIN_04 ] Finanz-Cockpit
        </h3>

        <div className="flex bg-surface-2 p-0.5 rounded-element border border-outline">
          <button 
            onClick={() => handleToggleNetto(false)}
            className={`px-3 py-1 text-[9px] font-bold font-mono uppercase tracking-wider rounded-element transition-all ${!isNetView ? 'bg-primary text-white dark:text-black font-extrabold shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Brutto
          </button>
          <button 
            onClick={() => handleToggleNetto(true)}
            className={`px-3 py-1 text-[9px] font-bold font-mono uppercase tracking-wider rounded-element transition-all ${isNetView ? 'bg-primary text-white dark:text-black font-extrabold shadow-sm' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Netto
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline">
        
        {/* PURCHASE SECTION */}
        <div className="p-6 flex flex-col justify-center bg-grid-pattern bg-opacity-5">
          <p className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest mb-1.5">
             {isNetView ? "Bestand EK (Net)" : "EK-Wert (Gross)"}
          </p>
          <div className="text-xl font-bold text-red-500 font-mono tracking-tight">
            -{stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

        {/* PROFIT SECTION (Center) */}
        <div className="p-6 flex flex-col justify-center bg-surface-2/30 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1 mx-auto px-2.5 py-0.5 rounded-element bg-surface-2 border border-outline mb-2">
            <span className="text-[9px] font-bold text-foreground/80 font-mono uppercase tracking-wider">
              {stats.margin.toFixed(1)}% Marge
            </span>
          </div>
          <p className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest mb-1">
            Reingewinn
          </p>
          <div className="text-2xl font-bold text-foreground font-mono tracking-tight animate-pulse-value">
            {stats.profit.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

        {/* SALES SECTION */}
        <div className="p-6 flex flex-col justify-center text-right bg-grid-pattern bg-opacity-5">
          <p className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest mb-1.5">
             {isNetView ? "Waren VK (Net)" : "VK-Wert (Gross)"}
          </p>
          <div className="text-xl font-bold text-emerald-500 font-mono tracking-tight">
            +{stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

      </div>

      {/* Bottom info */}
      <div className="bg-surface-2 px-6 py-2.5 flex items-center justify-between border-t border-outline font-mono text-[9px]">
        <span className="text-foreground/50 uppercase tracking-widest">
           Gebundene USt: <span className="text-foreground font-bold ml-1">{stats.vat.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
        </span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-element bg-red-500"></div>
             <span className="text-foreground/50 uppercase">Invest</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-element bg-emerald-500"></div>
             <span className="text-foreground/50 uppercase">Wert</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default InventoryValueWidget;
