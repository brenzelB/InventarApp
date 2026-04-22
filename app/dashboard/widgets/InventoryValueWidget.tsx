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
      <div className="h-full w-full bg-slate-900 rounded-3xl p-6 shadow-sm flex flex-col justify-center animate-pulse gap-8 border border-slate-800">
        <div className="h-24 bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }  return (
    <div className={`h-full w-full bg-white rounded-3xl shadow flex flex-col ring-1 ring-slate-200 overflow-hidden`}>
      
      {/* Header with Toggle */}
      <div className="px-8 pt-6 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-2xl">
            <Coins className="w-4 h-4 text-accent" />
          </div>
          Finanz-Cockpit
        </h3>

        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button 
            onClick={() => handleToggleNetto(false)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${!isNetView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Brutto
          </button>
          <button 
            onClick={() => handleToggleNetto(true)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${isNetView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Netto
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100">
        
        {/* PURCHASE SECTION */}
        <div className="p-8 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
             {isNetView ? "Bestandswert (Net EK)" : "EK-Wert (Brutto)"}
          </p>
          <div className="text-3xl font-black text-blue-600 tracking-tighter">
            -{stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

        {/* PROFIT SECTION (Center) */}
        <div className="p-8 flex flex-col justify-center bg-slate-50/50 text-center">
          <div className="inline-flex items-center gap-1.5 mx-auto px-3 py-1 rounded-full bg-slate-200/50 border border-slate-300 mb-3">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              {stats.margin.toFixed(1)}% Marge
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
            Reingewinn
          </p>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {stats.profit.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

        {/* SALES SECTION */}
        <div className="p-8 flex flex-col justify-center text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
             {isNetView ? "Warenwert (Net VK)" : "VK-Wert (Brutto)"}
          </p>
          <div className="text-3xl font-black text-emerald-600 tracking-tighter">
            +{stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
          </div>
        </div>

      </div>

      {/* Bottom info */}
      <div className="bg-slate-50 px-8 py-3 flex items-center justify-between border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
           Gebundene USt: <span className="text-slate-600 ml-1">{stats.vat.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
        </span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span className="text-[9px] font-bold text-slate-500 uppercase">Investition</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-[9px] font-bold text-slate-500 uppercase">Rückfluss</span>
           </div>
        </div>
      </div>

    </div>
  );
};

export default InventoryValueWidget;
