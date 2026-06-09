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
      <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-outline rounded-element"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex flex-col transition-colors duration-300">
      <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-outline pb-4">
        <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
          <Package className="w-3.5 h-3.5" />
        </div>
        [ SYS_STATUS_07 ] Lager-Status
      </h3>
      
      <div className="grid grid-cols-2 gap-4 flex-grow">
        <div className="flex flex-col justify-between items-center p-4 bg-surface-2/30 rounded-card border border-outline bg-grid-pattern bg-opacity-5">
          <div className="h-6 flex items-center">
            <span className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest">Artikel</span>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-4xl font-bold text-foreground font-mono tracking-tight">{stats.totalArticles}</span>
          </div>
          <div className="h-6 flex items-center">
            <span className="text-[9px] font-bold text-secondary font-mono uppercase tracking-widest whitespace-nowrap">{stats.totalUnits} Einheiten</span>
          </div>
        </div>

        <div className="flex flex-col justify-between items-center p-4 bg-surface-2/30 rounded-card border border-outline bg-grid-pattern bg-opacity-5">
          <div className="h-6 flex items-center">
            <span className="text-[9px] font-bold text-foreground/45 font-mono uppercase tracking-widest">Gruppen</span>
          </div>
          <div className="flex-1 flex items-center">
            <span className="text-4xl font-bold text-foreground font-mono tracking-tight">{stats.totalGroups}</span>
          </div>
          <div className="h-6 flex items-center">
            <span className="text-[9px] font-bold text-secondary font-mono uppercase tracking-widest whitespace-nowrap">Kategorien</span>
          </div>
        </div>
      </div>
    </div>
  );
}
