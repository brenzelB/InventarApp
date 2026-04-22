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
    <div className="h-full w-full bg-white rounded-3xl p-8 shadow ring-1 ring-slate-200 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-slate-500 flex items-center gap-2">
        <Package className="w-4 h-4 text-accent" />
        Lager-Status
      </h3>
      
      <div className="mt-4 grid grid-cols-2 gap-8">
        <div className="bg-slate-50 p-8 rounded-2xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Artikel Gesamt</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{articles.length}</p>
          <p className="text-xs text-accent font-black mt-1 uppercase tracking-widest">{totalStock} Einheiten</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-2xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FolderTree className="w-3 h-3 text-slate-400" />
            Kategorien
          </p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{totalCategories}</p>
        </div>
      </div>
    </div>
  );
}
