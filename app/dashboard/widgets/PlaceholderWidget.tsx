"use client";

import { Puzzle } from "lucide-react";

interface PlaceholderWidgetProps {
  title: string;
}

export function PlaceholderWidget({ title }: PlaceholderWidgetProps) {
  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-3">
        <Puzzle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
        Dieses Widget ist aktuell noch ein Platzhalter für zukünftige Entwicklungen.
      </p>
    </div>
  );
}
