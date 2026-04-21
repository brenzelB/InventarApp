"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";

export function WeeklyTrendWidget() {
  const [data, setData] = useState<{ date: string; input: number; output: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    async function loadTrend() {
      try {
        setLoading(true);
        const trend = await articleService.getHistoryTrend(days);
        
        // Dynamic grouping based on selected timeframe
        const grouped: Record<string, { input: number; output: number }> = {};
        
        // Fill all days in the timeframe with 0s to avoid gaps in chart
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
    }

    loadTrend();
  }, [days]);

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Bestands-Flow
        </h3>
        
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-1 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value={7}>7 Tage</option>
          <option value={30}>30 Tage</option>
          <option value={90}>90 Tage</option>
        </select>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }} 
                dy={10}
                interval={days > 7 ? 'preserveStartEnd' : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '8px', fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="input" 
                name="Eingang"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInput)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="output" 
                name="Ausgang"
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOutput)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
