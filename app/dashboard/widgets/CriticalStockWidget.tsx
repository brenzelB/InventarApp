"use client";

import { useMemo, useEffect, useState } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { Info, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getSettings } from "@/app/dashboard/settings/actions";

export function CriticalStockWidget() {
  const { articles, loading: articlesLoading, refetch } = useArticles();
  const [threshold, setThreshold] = useState<number>(0);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Force a fresh fetch when the dashboard mounts and load the global threshold
  useEffect(() => {
    async function loadData() {
      refetch(); // Trigger SWR / client fetch
      const res = await getSettings();
      if (res.success && res.settings?.warning_threshold) {
        setThreshold(Number(res.settings.warning_threshold) || 0);
      }
      setSettingsLoading(false);
    }
    loadData();
  }, [refetch]);

  const criticalItems = useMemo(() => {
    if (!articles) return [];

    const computedItems = articles.filter(a => {
      const quantity = Number(a.bestand) || 0;
      const minStock = Number(a.mindestbestand) || 0;
      
      // Calculate effective minimum: minimum_stock * (1 + threshold/100)
      const effectiveLimit = minStock * (1 + (threshold / 100));
      return quantity <= effectiveLimit;
    });

    console.log("LOW_STOCK_DATA:", computedItems);

    return computedItems
      .sort((a, b) => {
        const qA = Number(a.bestand) || 0;
        const mA = Number(a.mindestbestand) || 0;
        const qB = Number(b.bestand) || 0;
        const mB = Number(b.mindestbestand) || 0;
        return (qA - mA) - (qB - mB);
      })
      .slice(0, 5);
  }, [articles, threshold]);

  const loading = articlesLoading || settingsLoading;

  if (loading) {
    return (
      <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-outline rounded-element"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 border-t-2 border-t-primary shadow-[0_0_15px_rgba(224,108,117,0.05)] flex flex-col">
      <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-outline pb-4">
        <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
        [ SYS_CRIT_03 ] Kritische Bestände
      </h3>
      
      <div className="flex-1 min-h-0 overflow-auto pr-2 custom-scrollbar scrollbar-gutter-stable">
        {criticalItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-foreground/50">
            Alles im grünen Bereich.
          </div>
        ) : (
          <ul className="space-y-3">
            {criticalItems.map(item => (
              <li key={item.id} className="flex justify-between items-center group p-2 hover:bg-surface-2 rounded-element border border-transparent hover:border-outline transition-all">
                <Link href={`/dashboard/articles/${item.id}`} className="block overflow-hidden flex-1 group-hover:pl-1 transition-all">
                  <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                  <p className="text-[9px] text-foreground/40 font-mono uppercase tracking-widest">{item.sku}</p>
                </Link>
                <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                  <div>
                    <p className="text-xs font-bold text-primary font-mono flex items-center justify-end gap-1.5">
                      {item.bestand} 
                      <span className="text-[9px] text-foreground/50 font-bold font-mono">{item.unit || 'Stk'}</span>
                    </p>
                    <p className="text-[9px] font-bold text-foreground/50 flex items-center justify-end gap-1 font-mono uppercase tracking-tight">
                      {Number(item.bestand) === 0 ? 'Leer' : 'Kritisch'}
                      <AlertTriangle className="w-3 h-3 text-primary animate-pulse" />
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
