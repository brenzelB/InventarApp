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
      <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 flex items-center gap-2 mb-4">
        <AlertOctagon className="w-4 h-4" />
        Kritische Bestände
      </h3>
      
      <div className="flex-1 min-h-0 overflow-auto pr-6 custom-scrollbar scrollbar-gutter-stable">
        {criticalItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Alles im grünen Bereich.
          </div>
        ) : (
          <ul className="space-y-3">
            {criticalItems.map(item => (
              <li key={item.id} className="flex justify-between items-center group">
                <Link href={`/dashboard/articles/${item.id}`} className="block overflow-hidden flex-1 hover:text-indigo-600 transition-colors">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{item.sku}</p>
                </Link>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-black text-red-600">{item.bestand} <span className="text-[10px] font-medium text-red-400">{item.unit || 'Stk'}</span></p>
                  <p className="text-[10px] text-slate-400">Min: {item.mindestbestand}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
