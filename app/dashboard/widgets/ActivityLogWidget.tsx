"use client";

import { useEffect, useState } from "react";
import { ArticleHistoryEntry } from "@/modules/articles/types";
import { articleService } from "@/modules/articles/services/articleService";
import { Activity, ArrowUpRight, ArrowDownRight, Edit2 } from "lucide-react";
import Link from "next/link";

export function ActivityLogWidget() {
  const [history, setHistory] = useState<(ArticleHistoryEntry & { article?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await articleService.getRecentHistory(5);
        setHistory(data);
      } catch (err: any) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-emerald-500" />
        Aktivitäts-Log
      </h3>
      
      <div className="flex-1 overflow-auto max-h-[400px] pr-4 custom-scrollbar scrollbar-gutter-stable">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Keine Aktivitäten vorhanden.
          </div>
        ) : (
          <ul className="space-y-4">
            {history.map(entry => {
               const diff = entry.new_stock - entry.old_stock;
               const isInput = entry.type === 'input' && diff > 0;
               const isOutput = entry.type === 'output' || diff < 0;
               return (
                <li key={entry.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isInput ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    isOutput ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {isInput ? <ArrowUpRight className="w-3 h-3" /> : isOutput ? <ArrowDownRight className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/articles/${entry.article_id}`} className="hover:underline">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {entry.article?.name || 'Unbekannter Artikel'}
                      </p>
                    </Link>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right text-sm font-bold flex-shrink-0">
                    <span className={isInput ? 'text-emerald-500' : isOutput ? 'text-rose-500' : 'text-slate-500'}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </div>
                </li>
               );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
