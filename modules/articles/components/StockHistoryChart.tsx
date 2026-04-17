"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { ArticleHistoryEntry } from '../types';

interface StockHistoryChartProps {
  history: ArticleHistoryEntry[];
  initialStock: number;
}

export function StockHistoryChart({ history, initialStock }: StockHistoryChartProps) {
  const data = useMemo(() => {
    // We sort history by date ascending to calculate stock over time
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let currentStock = initialStock;
    
    // First data point is current stock (reversed) or we start from the past?
    // Actually, to show history correctly, we need to know the stock AT THE START of the history period.
    // Let's assume the 'initialStock' passed here is the CURRENT stock.
    // To get past stock: currentStock - sum(all changes)
    return sortedHistory.map(entry => {
      return {
        date: new Date(entry.created_at).toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        stock: entry.new_stock
      };
    });
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-slate-500 italic">Noch keine Bestandsdaten für eine Analyse vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Area 
            type="monotone" 
            dataKey="stock" 
            name="Bestand"
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorStock)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
