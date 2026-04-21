"use client";

import { useMemo } from "react";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { AlertOctagon } from "lucide-react";
import Link from "next/link";

export function CriticalStockWidget() {
  const { articles, loading } = useArticles();

  const criticalItems = useMemo(() => {
    return articles
      .filter(a => a.bestand < a.mindestbestand)
      .sort((a, b) => (a.bestand - a.mindestbestand) - (b.bestand - b.mindestbestand))
      .slice(0, 5);
  }, [articles]);

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
      
      <div className="flex-1 overflow-auto">
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
