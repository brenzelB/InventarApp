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
      <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Package className="w-4 h-4 text-indigo-500" />
        Lager-Status
      </h3>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Artikel Gesamt</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{articles.length}</p>
          <p className="text-xs text-indigo-600 font-medium mt-1">{totalStock} Einheiten</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FolderTree className="w-3 h-3" />
            Kategorien
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCategories}</p>
        </div>
      </div>
    </div>
  );
}
