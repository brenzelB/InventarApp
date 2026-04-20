"use client";

import { useState, useRef } from "react";
import { importExportService } from "../services/importExportService";
import { Loader2, Upload, FileCheck, AlertCircle, X } from "lucide-react";

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; groupsCreated: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const res = await importExportService.importFromExcel(file);
      setResult(res);
      if (res.success > 0) onSuccess();
    } catch (err: any) {
      setResult({ success: 0, groupsCreated: 0, errors: [err.message || 'Import fehlgeschlagen'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Smart Import</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-8">
          {!result && !loading && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-900 dark:text-white">Excel-Datei auswählen</p>
                <p className="text-sm text-slate-500 mt-1">Klicken oder Datei hierher ziehen</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <div className="text-center">
                <p className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Verarbeite Daten...</p>
                <p className="text-sm text-slate-500 mt-1">Gruppen werden zugeordnet und Artikel erstellt.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-green-700 dark:text-green-400 uppercase">Erfolg</p>
                  <p className="text-xs text-green-600 dark:text-green-400/80">
                    {result.success} Artikel importiert, {result.groupsCreated} Gruppen neu erstellt.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Hinweise / Fehler</p>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-[11px] text-red-500 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform active:scale-95"
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
