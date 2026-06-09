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
      console.log("[ActivityLogWidget] Fetching logs...");
      const data = await articleService.getActivityLogs(20);
      console.log("[ActivityLogWidget] Received data:", data);
      setLogs(data);
    } catch (err: any) {
      console.error("[ActivityLogWidget] Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Local subscription for Mock Mode and instant updates
    const unsubscribe = articleService.subscribe(() => {
      console.log("[ActivityLogWidget] Refreshing due to service notification");
      load();
    });
    return () => unsubscribe();
  }, [load]);

  console.log("[ActivityLogWidget] Current Logs:", logs);

  // Realtime Subscription
  useSupabaseRealtime('activity_logs', (payload) => {
    console.log("[ActivityLogWidget] Realtime event:", payload);
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

  const getLogConfig = (type: string, message: string = "") => {
    try {
      switch (type) {
        case 'create':
          return {
            icon: <PlusCircle className="w-3.5 h-3.5" />,
            colorClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
            dotClass: 'bg-emerald-500'
          };
        case 'delete':
          return {
            icon: <Trash2 className="w-3.5 h-3.5" />,
            colorClass: 'bg-red-500/10 text-red-500 border border-red-500/20',
            dotClass: 'bg-red-500'
          };
        case 'import':
          return {
            icon: <UploadCloud className="w-3.5 h-3.5" />,
            colorClass: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
            dotClass: 'bg-blue-500'
          };
        case 'stock_adjustment':
          const isUp = message.includes('->') && (() => {
            try {
              const parts = message.split('->');
              if (parts.length < 2) return false;
              const newVal = parseFloat(parts[1].trim());
              const oldVal = parseFloat(parts[0].split(':').pop()?.trim() || '0');
              return newVal > oldVal;
            } catch (e) {
              return false;
            }
          })();
          return {
            icon: isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />,
            colorClass: isUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20',
            dotClass: isUp ? 'bg-emerald-500' : 'bg-primary'
          };
        default:
          return {
            icon: <Activity className="w-3.5 h-3.5" />,
            colorClass: 'bg-surface-2 text-foreground/70 border border-outline',
            dotClass: 'bg-foreground/50'
          };
      }
    } catch (err) {
      console.error("Error in getLogConfig:", err);
      return {
        icon: <Activity className="w-3.5 h-3.5" />,
        colorClass: 'bg-surface-2 text-foreground/70 border border-outline',
        dotClass: 'bg-foreground/50'
      };
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex items-center justify-center animate-pulse">
        <div className="h-4 w-20 bg-outline rounded-element"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6 border-b border-outline pb-4">
        <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
          <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
            <Activity className="w-3.5 h-3.5" />
          </div>
          [ SYS_LOG_02 ] Aktivitäts-Log
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary font-mono uppercase tracking-widest animate-pulse">
          <Clock className="w-3 h-3 text-secondary" />
          Live
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-auto pr-2 custom-scrollbar scrollbar-gutter-stable">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-10 h-10 rounded-element bg-surface-2 border border-outline flex items-center justify-center">
              <Activity className="w-5 h-5 text-foreground/30" />
            </div>
            <p className="text-[10px] text-foreground/50 font-bold font-mono uppercase tracking-widest">
              Keine Aktivitäten vorhanden
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map(log => {
              const config = getLogConfig(log.type, log.message);
              return (
                <li 
                  key={log.id} 
                  className={`group relative flex items-start gap-3 p-2.5 rounded-element transition-all hover:bg-surface-2 border border-transparent hover:border-outline
                    ${log.id === lastNewId ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-element flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${config.colorClass}`}>
                    {config.icon}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground leading-tight font-sans">
                      {log.article_id ? (
                        <Link href={`/dashboard/articles/${log.article_id}`} className="hover:text-primary hover:underline transition-colors">
                          {log.message}
                        </Link>
                      ) : (
                        log.message
                      )}
                    </p>
                    <p className="text-[9px] font-bold text-foreground/40 font-mono uppercase tracking-widest mt-1">
                      {formatTimestamp(log.created_at)}
                    </p>
                  </div>

                  {log.id === lastNewId && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-element animate-in slide-in-from-left-2 shadow-[0_0_8px_var(--primary)]" />
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
