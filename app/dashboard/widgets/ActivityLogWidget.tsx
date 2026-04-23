"use client";

import { useEffect, useState, useCallback } from "react";
import { ActivityLog } from "@/modules/articles/types";
import { articleService } from "@/modules/articles/services/articleService";
import { 
  Activity, 
  PlusCircle, 
  Trash2, 
  UploadCloud, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

export function ActivityLogWidget() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastNewId, setLastNewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await articleService.getActivityLogs(15);
      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime Subscription
  useSupabaseRealtime('activity_logs', (payload) => {
    load(); 
    if (payload.eventType === 'INSERT') {
      setLastNewId(payload.new.id);
      setTimeout(() => setLastNewId(null), 3000);
    }
  }, 'INSERT');

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Heute, ${timeStr}`;
    return `${date.toLocaleDateString('de-DE')}, ${timeStr}`;
  };

  const getLogConfig = (type: string, message: string) => {
    switch (type) {
      case 'create':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5" />,
          colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          dotClass: 'bg-emerald-500'
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-3.5 h-3.5" />,
          colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          dotClass: 'bg-rose-500'
        };
      case 'import':
        return {
          icon: <UploadCloud className="w-3.5 h-3.5" />,
          colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
          dotClass: 'bg-blue-500'
        };
      case 'stock_adjustment':
        const isUp = message.includes('->') && (() => {
          const parts = message.split('->');
          return parseFloat(parts[1]) > parseFloat(parts[0].split(':').pop() || '0');
        })();
        return {
          icon: isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />,
          colorClass: isUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600',
          dotClass: isUp ? 'bg-emerald-500' : 'bg-blue-500'
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
          dotClass: 'bg-slate-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          Aktivitäts-Log
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          Live
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-auto pr-2 custom-scrollbar scrollbar-gutter-stable">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
              <Activity className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Keine Aktivitäten vorhanden
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {logs.map(log => {
              const config = getLogConfig(log.type, log.message);
              return (
                <li 
                  key={log.id} 
                  className={`group relative flex items-start gap-4 p-3 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50
                    ${log.id === lastNewId ? 'ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${config.colorClass}`}>
                    {config.icon}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {log.article_id ? (
                        <Link href={`/dashboard/articles/${log.article_id}`} className="hover:text-blue-600 transition-colors">
                          {log.message}
                        </Link>
                      ) : (
                        log.message
                      )}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      {formatTimestamp(log.created_at)}
                    </p>
                  </div>

                  {log.id === lastNewId && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-500 rounded-full animate-in slide-in-from-left-2" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
