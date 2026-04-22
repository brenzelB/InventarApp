"use client";

import { useMemo, useEffect, useState } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { AlertOctagon } from "lucide-react";
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
      <div className="h-full w-full bg-white dark:bg-widget rounded-3xl p-8 shadow flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-widget rounded-3xl p-8 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
          <Info className="w-4 h-4 text-blue-500" />
        </div>
        Kritische Bestände
      </h3>
      
      <div className="flex-1 min-h-0 overflow-auto pr-6 custom-scrollbar scrollbar-gutter-stable">
        {criticalItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Alles im grünen Bereich.
          </div>
        ) : (
          <ul className="space-y-4">
            {criticalItems.map(item => (
              <li key={item.id} className="flex justify-between items-center group p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all">
                <Link href={`/dashboard/articles/${item.id}`} className="block overflow-hidden flex-1 group-hover:pl-1 transition-all">
                  <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.sku}</p>
                </Link>
                <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                  <div>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center justify-end gap-1.5">
                      {item.bestand} 
                      <span className="text-[10px] font-black text-blue-400/70">{item.unit || 'Stk'}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 flex items-center justify-end gap-1.5">
                      {Number(item.bestand) === 0 ? 'Nicht vorrätig' : 'Niedriger Bestand'}
                      <AlertTriangle className="w-3 h-3 text-red-500" />
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
