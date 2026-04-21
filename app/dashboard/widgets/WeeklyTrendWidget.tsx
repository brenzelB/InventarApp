"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";

export function WeeklyTrendWidget() {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrend() {
      try {
        const trend = await articleService.getHistoryTrend(7);
        
        // Group by day string e.g. "Mo, 24.04"
        const grouped: Record<string, number> = {};
        
        // Let's create an empty bucket for the last 7 days so days with 0 movements still show up
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit' });
          grouped[dayStr] = 0;
        }

        trend.forEach(entry => {
          const d = new Date(entry.created_at);
          const dayStr = d.toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit' });
          if (grouped[dayStr] !== undefined) {
            grouped[dayStr] += Math.abs(entry.amount);
          }
        });

        const formattedData = Object.keys(grouped).map(key => ({
          date: key,
          value: grouped[key]
        }));

        setData(formattedData);
      } catch (err) {
        console.error("Failed to load trend:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTrend();
  }, []);

  return (
    <div className="h-full w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        Summe der Bestandsbewegungen (7 Tage)
      </h3>

      <div className="flex-1 w-full relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1/2 h-1/2 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Bewegte Menge"
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
