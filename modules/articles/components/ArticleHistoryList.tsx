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
          icon: <ArrowUpRight className="w-4 h-4" />, 
          bg: 'bg-green-50 dark:bg-green-900/20', 
          text: 'text-green-700 dark:text-green-400', 
          label: 'Einlagerung' 
        };
      case 'output':
        return { 
          icon: <ArrowDownRight className="w-4 h-4" />, 
          bg: 'bg-red-50 dark:bg-red-900/20', 
          text: 'text-red-700 dark:text-red-400', 
          label: 'Entnahme' 
        };
      default:
        return { 
          icon: <RefreshCw className="w-4 h-4" />, 
          bg: 'bg-slate-50', 
          text: 'text-slate-700', 
          label: 'System' 
        };
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <p className="text-slate-500 text-sm font-semibold">Keine Buchungshistorie vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-bold tracking-wide text-slate-900">Letzte Bewegungen</h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-900 uppercase tracking-widest">Typ</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-900 uppercase tracking-widest">Menge</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-900 uppercase tracking-widest">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {history.map((entry) => {
                const config = getTypeConfig(entry.type);
                const amount = entry.new_stock - entry.old_stock;
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                        {config.icon}
                        {config.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {amount > 0 ? `+${amount}` : amount}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400 font-medium">
                        ({entry.old_stock} → {entry.new_stock})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
