"use client";

import { History, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';
import { ArticleHistoryEntry } from '../types';

interface ArticleHistoryListProps {
  history: ArticleHistoryEntry[];
}

export function ArticleHistoryList({ history }: ArticleHistoryListProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'input':
        return { 
          icon: <ArrowUpRight className="w-3.5 h-3.5" />, 
          bg: 'bg-secondary/10 border-secondary/20', 
          text: 'text-secondary', 
          label: 'Einlagerung' 
        };
      case 'output':
        return { 
          icon: <ArrowDownRight className="w-3.5 h-3.5" />, 
          bg: 'bg-primary/10 border-primary/20', 
          text: 'text-primary', 
          label: 'Entnahme' 
        };
      default:
        return { 
          icon: <RefreshCw className="w-3.5 h-3.5" />, 
          bg: 'bg-surface-2 border-outline', 
          text: 'text-foreground/70', 
          label: 'System' 
        };
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-10 bg-widget rounded-card border border-outline shadow-sm">
        <p className="text-foreground/60 text-xs font-mono uppercase tracking-widest">Keine Buchungshistorie vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-bold tracking-wide text-foreground uppercase font-sora">[ TRANSACTION_LOG ] Letzte Bewegungen</h3>
      </div>

      <div className="overflow-hidden border border-outline bg-widget rounded-card shadow-sm bg-grid-pattern bg-opacity-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-outline">
            <thead className="bg-surface-2 dark:bg-surface-2/40 border-b border-outline">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold font-mono text-foreground/75 uppercase tracking-widest">Typ</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold font-mono text-foreground/75 uppercase tracking-widest">Menge</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold font-mono text-foreground/75 uppercase tracking-widest">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline bg-transparent">
              {history.map((entry) => {
                const config = getTypeConfig(entry.type);
                const amount = entry.new_stock - entry.old_stock;
                return (
                  <tr key={entry.id} className="hover:bg-surface-2/30 transition-all border-b border-outline last:border-0">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-element text-[10px] font-mono font-bold uppercase tracking-wider border ${config.bg} ${config.text}`}>
                        {config.icon}
                        {config.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-mono font-bold ${amount > 0 ? 'text-secondary' : 'text-primary'}`}>
                        {amount > 0 ? `+${amount}` : amount}
                      </span>
                      <span className="ml-2 text-[10px] text-foreground/45 font-mono">
                        ({entry.old_stock} → {entry.new_stock})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground/75 font-mono">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-foreground/40" />
                        {new Date(entry.created_at).toLocaleString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
