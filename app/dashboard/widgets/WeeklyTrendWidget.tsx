"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCcw, TrendingUp } from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";

export function WeeklyTrendWidget() {
  const [data, setData] = useState<{ date: string; input: number; output: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const loadTrend = async () => {
    try {
      setLoading(true);
      const trend = await articleService.getHistoryTrend(days);
      
      const grouped: Record<string, { input: number; output: number }> = {};
      
      if (days === 1) {
        // Hourly grouping for today
        for (let i = 23; i >= 0; i--) {
          const d = new Date();
          d.setHours(d.getHours() - i, 0, 0, 0);
          const timeStr = d.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
          grouped[timeStr] = { input: 0, output: 0 };
        }

        trend.forEach(entry => {
          const d = new Date(entry.created_at);
          d.setMinutes(0, 0, 0); // Floor to hour
          const timeStr = d.toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' });
          if (grouped[timeStr] !== undefined) {
            if (entry.type === 'input') {
              grouped[timeStr].input += Math.abs(entry.amount);
            } else {
              grouped[timeStr].output += Math.abs(entry.amount);
            }
          }
        });
      } else {
        // Daily grouping
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString("de-DE", { 
            weekday: days <= 7 ? 'short' : undefined, 
            day: '2-digit', 
            month: '2-digit' 
          });
          grouped[dayStr] = { input: 0, output: 0 };
        }

        trend.forEach(entry => {
          const d = new Date(entry.created_at);
          const dayStr = d.toLocaleDateString("de-DE", { 
            weekday: days <= 7 ? 'short' : undefined, 
            day: '2-digit', 
            month: '2-digit' 
          });
          if (grouped[dayStr] !== undefined) {
            if (entry.type === 'input') {
              grouped[dayStr].input += Math.abs(entry.amount);
            } else {
              grouped[dayStr].output += Math.abs(entry.amount);
            }
          }
        });
      }

      const formattedData = Object.keys(grouped).map(key => ({
        date: key,
        ...grouped[key]
      }));

      setData(formattedData);
    } catch (err) {
      console.error("Failed to load trend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrend();

    // Auto-refresh every 60s for "Today" view
    let interval: any;
    if (days === 1) {
      interval = setInterval(loadTrend, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [days]);

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          Bestands-Flow
        </h3>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadTrend()}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Aktualisieren"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-3 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <option value={1}>Heute</option>
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
          </select>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {!loading && data.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-medium">
             Keine Daten für diesen Zeitraum.
           </div>
        ) : loading && data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }} 
                dy={12}
                interval={days === 1 ? 2 : days > 7 ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                labelStyle={{ fontWeight: '900', color: '#1e293b', marginBottom: '10px', fontSize: '13px' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area 
                type={days === 1 ? "stepAfter" : "monotone"} 
                dataKey="input" 
                name="Eingang"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInput)" 
                animationDuration={1500}
                isAnimationActive={true}
              />
              <Area 
                type={days === 1 ? "stepAfter" : "monotone"} 
                dataKey="output" 
                name="Ausgang"
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOutput)" 
                animationDuration={1500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
