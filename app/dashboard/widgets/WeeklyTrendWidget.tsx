"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Legend 
} from "recharts";
import { 
  BarChart2, Layout as LayoutIcon, RefreshCcw, TrendingUp 
} from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useTheme } from "@/components/ThemeProvider";

interface WeeklyTrendWidgetProps {
  config: {
    timeRange?: string | number;
    chartType?: 'area' | 'bar' | 'line';
    days?: number;
  };
  onUpdateConfig?: (newConfig: any) => void;
}

export function WeeklyTrendWidget({ config, onUpdateConfig }: WeeklyTrendWidgetProps) {
  const [data, setData] = useState<{ date: string; input: number; output: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  
  // Detect if dark mode is active (considering system preference)
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Robust initialization and logging
  const timeRange = config.timeRange || config.days || '7';
  const chartType = config.chartType || 'area';

  useEffect(() => {
    console.log("📂 GELADENE WIDGET SETTINGS:", config);
  }, [config]);

  // Realtime Updates for Chart Data
  useSupabaseRealtime('articles', () => loadTrend());
  useSupabaseRealtime('article_history', () => loadTrend());

  const loadTrend = async () => {
    try {
      setLoading(true);
      const numDays = Number(timeRange);
      
      // 1. Get History
      const trend = await articleService.getHistoryTrend(numDays);
      
      // 2. Get Current Total Stock for all articles
      const articles = await articleService.getArticles();
      const currentGrandTotal = articles.reduce((sum, a) => sum + (Number(a.bestand) || 0), 0);

      const grouped: Record<string, { input: number; output: number; total: number }> = {};
      
      if (numDays === 1) {
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 24; i++) {
          const d = new Date(baseDate);
          d.setHours(i);
          const timeStr = d.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
          grouped[timeStr] = { input: 0, output: 0, total: 0 };
        }

        trend.forEach(entry => {
          const d = new Date(entry.created_at);
          if (d.toDateString() === baseDate.toDateString()) {
            d.setMinutes(0, 0, 0);
            const timeStr = d.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
            if (grouped[timeStr] !== undefined) {
              if (entry.type === 'input') grouped[timeStr].input += Math.abs(entry.amount);
              else grouped[timeStr].output += Math.abs(entry.amount);
            }
          }
        });
      } else {
        for (let i = numDays - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString("de-DE", { 
            weekday: numDays <= 7 ? 'short' : undefined, 
            day: '2-digit', 
            month: '2-digit' 
          });
          grouped[dayStr] = { input: 0, output: 0, total: 0 };
        }

        trend.forEach(entry => {
          const d = new Date(entry.created_at);
          const dayStr = d.toLocaleDateString("de-DE", { 
            weekday: numDays <= 7 ? 'short' : undefined, 
            day: '2-digit', 
            month: '2-digit' 
          });
          if (grouped[dayStr] !== undefined) {
            if (entry.type === 'input') grouped[dayStr].input += Math.abs(entry.amount);
            else grouped[dayStr].output += Math.abs(entry.amount);
          }
        });
      }

      // 3. Backwards-Accumulation for Cumulative Stock
      const buckets = Object.keys(grouped);
      let runningTotal = currentGrandTotal;
      
      for (let i = buckets.length - 1; i >= 0; i--) {
        const key = buckets[i];
        grouped[key].total = runningTotal;
        runningTotal -= (grouped[key].input - grouped[key].output);
      }

      const formattedData = buckets.map(key => ({
        date: key,
        ...grouped[key]
      }));

      setData(formattedData);
    } catch (err) {
      console.error("Failed to load trend 2.0:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrend();
    if (Number(timeRange) === 1) {
      const interval = setInterval(loadTrend, 60000);
      return () => clearInterval(interval);
    }
  }, [timeRange]);

  const updateSettings = (newSettings: any) => {
    console.log("💾 SPEICHERE WIDGET SETTINGS:", newSettings);
    onUpdateConfig?.(newSettings);
  };

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-slate-800 rounded-2xl">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          Bestands-Analyse
        </h3>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => updateSettings({ chartType: chartType === 'area' ? 'bar' : 'area' })}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Darstellung umschalten"
          >
            {chartType === 'area' ? <BarChart2 className="w-4 h-4" /> : <LayoutIcon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => loadTrend()}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <select 
            value={timeRange} 
            onChange={(e) => updateSettings({ timeRange: Number(e.target.value) })}
            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-600 cursor-pointer text-slate-700 dark:text-slate-300"
          >
            <option value={1}>Heute</option>
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
          </select>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {loading && data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }} 
                dy={12}
                interval={Number(timeRange) === 1 ? 2 : Number(timeRange) > 7 ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                  padding: '16px' 
                }}
                labelStyle={{ fontWeight: '900', color: isDark ? '#f1f5f9' : '#1e293b', marginBottom: '10px', fontSize: '13px' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: isDark ? '#94a3b8' : '#475569' 
                }} 
              />
              
              {chartType === 'area' ? (
                <>
                  <Area type="monotone" dataKey="input" name="Eingang (+)" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="output" name="Ausgang (-)" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.1} />
                </>
              ) : (
                <>
                  <Bar dataKey="input" name="Eingang (+)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="output" name="Ausgang (-)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </>
              )}
              
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Gesamtbestand" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={false}
                animationDuration={2000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
