"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Lock, Tag, Coins, ArrowUpRight, Percent } from "lucide-react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useState } from "react";

export function InventoryValueWidget({ config, onUpdateConfig }: { config: any, onUpdateConfig: (settings: any) => void }) {
  const { articles, loading, refetch } = useArticles();
  const [isPulsing, setIsPulsing] = useState(false);
  const [isNetto, setIsNetto] = useState(config?.isNetto ?? false);

  useSupabaseRealtime('articles', () => {
    refetch();
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1500);
  });

  const handleToggleNetto = (val: boolean) => {
    setIsNetto(val);
    onUpdateConfig({ isNetto: val });
  };

  const stats = useMemo(() => {
    if (!articles || articles.length === 0) return { buy: 0, sell: 0, profit: 0, margin: 0, vat: 0 };
    
    let totalBuy = 0;
    let totalSell = 0;
    let totalVat = 0;

    articles.forEach(item => {
      const quantity = Number(item.bestand) || 0;
      const grossBuy = Number(item.purchase_price || 0) * quantity;
      const grossSell = Number(item.verkaufspreis || 0) * quantity;
      const taxRate = Number(item.tax_rate || 0);

      const netBuy = grossBuy / (1 + (taxRate / 100));
      const netSell = grossSell / (1 + (taxRate / 100));

      if (isNetto) {
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
  }, [articles, isNetto]);

  const buyRatio = stats.sell > 0 ? (stats.buy / stats.sell) * 100 : 0;
  const profitRatio = stats.sell > 0 ? (stats.profit / stats.sell) * 100 : 0;

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-900 rounded-xl p-6 shadow-sm flex flex-col justify-center animate-pulse gap-4 border border-slate-800">
        <div className="h-24 bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-800 flex flex-col no-drag transition-all duration-500 overflow-hidden relative ${isPulsing ? 'ring-indigo-500 ring-2 ring-offset-2 ring-offset-slate-900' : ''}`}>
      
      {/* Header with Toggle */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-indigo-400" />
          Finanz-Cockpit {isNetto ? <span className="text-indigo-400/50 ml-1">(Netto)</span> : <span className="text-slate-600 ml-1">(Brutto)</span>}
        </h3>

        <div className="flex bg-slate-800/50 p-0.5 rounded-lg border border-slate-700/50 ring-1 ring-black/20">
          <button 
            onClick={() => handleToggleNetto(false)}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${!isNetto ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Brutto
          </button>
          <button 
            onClick={() => handleToggleNetto(true)}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${isNetto ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Netto
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-800/50 relative">
        
        {/* PURCHASE SECTION */}
        <div className="relative group p-6 flex flex-col justify-center border-l-2 border-indigo-500/0 hover:border-indigo-500 transition-all overflow-hidden shadow-[inset_4px_0_12px_-4px_rgba(99,102,241,0)] hover:shadow-[inset_4px_0_12px_-4px_rgba(99,102,241,0.2)]">
          <Lock className="absolute -right-2 -bottom-2 w-24 h-24 text-indigo-400/5 group-hover:text-indigo-400/10 transition-all rotate-12" />
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">
              {isNetto ? "Einkaufswert (Netto)" : "Einkaufswert (Brutto)"}
            </p>
            <div className={`flex items-baseline gap-1 transition-all ${isPulsing ? 'animate-pulse-value' : ''}`}>
              <span className="text-xl font-black text-indigo-100 tracking-tight">
                {stats.buy.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-bold text-indigo-500/50">€</span>
            </div>
          </div>
        </div>

        {/* PROFIT SECTION (Highlighted Center) */}
        <div className="relative group p-6 flex flex-col justify-center bg-slate-800/20 overflow-hidden text-center">
          <Coins className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-amber-400/5 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 mb-2">
              <Percent className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">
                {stats.margin.toFixed(1)}% Marge
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {isNetto ? "Gewinn (Netto)" : "Gewinn (Brutto)"}
            </p>
            <div className={`flex items-baseline justify-center gap-1 transition-all ${isPulsing ? 'animate-pulse-value' : ''}`}>
              <span className="text-3xl font-black text-white tracking-tighter drop-shadow-2xl">
                {stats.profit.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-amber-400">€</span>
            </div>
          </div>
        </div>

        {/* SALES SECTION */}
        <div className="relative group p-6 flex flex-col justify-center text-right border-r-2 border-emerald-500/0 hover:border-emerald-500 transition-all overflow-hidden shadow-[inset_-4px_0_12px_-4px_rgba(16,185,129,0)] hover:shadow-[inset_-4px_0_12px_-4px_rgba(16,185,129,0.2)]">
          <Tag className="absolute -left-2 -bottom-2 w-24 h-24 text-emerald-400/5 group-hover:text-emerald-400/10 transition-all -rotate-12" />
          <div className="relative z-10">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">
              {isNetto ? "Verkaufswert (Netto)" : "Verkaufswert (Brutto)"}
            </p>
            <div className={`flex items-baseline justify-end gap-1 transition-all ${isPulsing ? 'animate-pulse-value' : ''}`}>
              <span className="text-xl font-black text-emerald-400 tracking-tight">
                {stats.sell.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-bold text-emerald-600/50">€</span>
            </div>
          </div>
        </div>

      </div>

      {/* VAT Info & Ratio Bar */}
      <div className="bg-slate-900/50 border-t border-slate-800/50 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
            Gebundene USt: <span className="text-slate-300">{stats.vat.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-1 bg-indigo-500 rounded-full"></div>
            <span className="text-[7px] font-bold text-slate-600 uppercase">EK-Anteil</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-1 bg-emerald-500 rounded-full"></div>
            <span className="text-[7px] font-bold text-slate-600 uppercase">Rohgewinn</span>
          </div>
        </div>
      </div>

      {/* Ratio Bar */}
      <div className="h-1.5 flex w-full bg-slate-800 relative group/bar hover:h-2 transition-all cursor-crosshair">
        <div 
          className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]" 
          style={{ width: `${buyRatio}%` }}
        />
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.6)]" 
          style={{ width: `${profitRatio}%` }}
        />
      </div>

    </div>
  );
}
