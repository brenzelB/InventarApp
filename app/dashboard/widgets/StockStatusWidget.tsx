"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Package, FolderTree } from "lucide-react";

export function StockStatusWidget() {
  const { articles, loading } = useArticles();

  const { totalStock, totalCategories } = useMemo(() => {
    let totalStockNum = 0;
    const groups = new Set<string>();

    articles.forEach(a => {
      totalStockNum += a.bestand || 0;
      if (a.group_id) groups.add(a.group_id);
    });

    return {
      totalStock: totalStockNum,
      totalCategories: groups.size
    };
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white rounded-3xl p-8 shadow flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Package className="w-4 h-4 text-accent" />
        Lager-Status
      </h3>
      
      <div className="mt-2 grid grid-cols-2 gap-6">
        <div className="h-52 bg-slate-50/50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-between p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
          <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em]">Artikel</div>
          <div className="text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none">{articles.length}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.1em]">{totalStock} Einheiten</div>
        </div>
        <div className="h-52 bg-slate-50/50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-between p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
          <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em]">Gruppen</div>
          <div className="text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none">{totalCategories}</div>
          <div className="text-[11px] opacity-0 pointer-events-none" aria-hidden="true">PLACEHOLDER</div>
        </div>
      </div>
    </div>
  );
}
