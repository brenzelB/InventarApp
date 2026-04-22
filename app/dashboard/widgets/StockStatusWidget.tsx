"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Package, FolderTree } from "lucide-react";

export function StockStatusWidget() {
  const { articles, loading } = useArticles();

  const stats = useMemo(() => {
    let totalUnits = 0;
    const groups = new Set<string>();

    articles.forEach(a => {
      totalUnits += Number(a.bestand) || 0;
      if (a.group_id) groups.add(a.group_id);
    });

    return {
      totalArticles: articles.length,
      totalUnits,
      totalGroups: groups.size
    };
  }, [articles]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
          <Package className="w-4 h-4 text-accent" />
        </div>
        Lager-Status
      </h3>
      
      <div className="mt-2 grid grid-cols-2 gap-6 flex-1">
        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] p-6 flex flex-col justify-between items-center ring-1 ring-slate-100 dark:ring-slate-800/50">
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Artikel</span>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{stats.totalArticles}</span>
          </div>
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{stats.totalUnits} Einheiten</span>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] p-6 flex flex-col justify-between items-center ring-1 ring-slate-100 dark:ring-slate-800/50">
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gruppen</span>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{stats.totalGroups}</span>
          </div>
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">Kategorien</span>
          </div>
        </div>
      </div>
    </div>
  );
}
