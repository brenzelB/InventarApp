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
    <div className="h-full w-full bg-widget border border-outline rounded-card p-6 flex flex-col transition-colors duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-outline pb-4">
        <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2">
          <div className="p-1 bg-surface-2 text-primary rounded-element border border-outline">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          [ SYS_ANALYZE_09 ] Bestands-Analyse
        </h3>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => updateSettings({ chartType: chartType === 'area' ? 'bar' : 'area' })}
            className="p-1.5 text-foreground/50 hover:text-primary transition-colors rounded-element hover:bg-surface-2"
            title="Darstellung umschalten"
          >
            {chartType === 'area' ? <BarChart2 className="w-3.5 h-3.5" /> : <LayoutIcon className="w-3.5 h-3.5" />}
          </button>

          <button 
            onClick={() => loadTrend()}
            className="p-1.5 text-foreground/50 hover:text-primary transition-colors rounded-element hover:bg-surface-2"
          >
            <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <select 
            value={timeRange} 
            onChange={(e) => updateSettings({ timeRange: Number(e.target.value) })}
            className="text-[9px] font-bold font-mono uppercase tracking-wider bg-surface-2 border-0 rounded-element px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-foreground"
          >
            <option value={1} className="bg-widget">Heute</option>
            <option value={7} className="bg-widget">7 Tage</option>
            <option value={30} className="bg-widget">30 Tage</option>
            <option value={90} className="bg-widget">90 Tage</option>
          </select>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {loading && data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'var(--foreground)', opacity: 0.5, fontWeight: 500, fontFamily: 'var(--font-jetbrains), monospace' }} 
                dy={12}
                interval={Number(timeRange) === 1 ? 2 : Number(timeRange) > 7 ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'var(--foreground)', opacity: 0.5, fontWeight: 500, fontFamily: 'var(--font-jetbrains), monospace' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 'var(--border-radius-card)', 
                  border: '1px solid var(--outline)', 
                  backgroundColor: 'var(--widget)',
                  color: 'var(--foreground)',
                  padding: '12px' 
                }}
                labelStyle={{ fontWeight: '700', fontFamily: 'var(--font-sora), sans-serif', color: 'var(--foreground)', marginBottom: '8px', fontSize: '11px' }}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="rect"
                iconSize={8}
                wrapperStyle={{ 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  fontFamily: 'var(--font-jetbrains), monospace',
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: 'var(--foreground)'
                }} 
              />
              
              {chartType === 'area' ? (
                <>
                  <Area type="monotone" dataKey="input" name="Eingang (+)" stroke="var(--secondary)" strokeWidth={2} fill="url(#colorInput)" />
                  <Area type="monotone" dataKey="output" name="Ausgang (-)" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.05} />
                </>
              ) : (
                <>
                  <Bar dataKey="input" name="Eingang (+)" fill="var(--secondary)" radius={[2, 2, 0, 0]} barSize={12} fillOpacity={0.8} />
                  <Bar dataKey="output" name="Ausgang (-)" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={12} fillOpacity={0.8} />
                </>
              )}
              
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Gesamtbestand" 
                stroke="var(--primary)" 
                strokeWidth={3} 
                dot={false}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
