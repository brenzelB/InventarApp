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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/85 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div className="bg-widget rounded-card shadow-lg w-full max-w-md overflow-hidden border border-outline bg-grid-pattern bg-opacity-5 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-2 dark:bg-surface-2/40">
          <h3 className="text-sm font-bold text-foreground font-sora uppercase tracking-wide">[ SMART_IMPORT ] Smart Import</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-element transition-colors">
            <X className="w-4 h-4 text-foreground/45" />
          </button>
        </div>

        <div className="p-6">
          {!result && !loading && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border border-dashed border-outline hover:border-primary rounded-element p-8 flex flex-col items-center justify-center gap-6 transition-all hover:bg-primary/5 bg-surface-0"
            >
              <div className="w-12 h-12 rounded-element bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground font-sora">Excel-Datei auswählen</p>
                <p className="text-xs text-foreground/60 mt-1 font-sans">Klicken oder Datei hierher ziehen</p>
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
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold font-mono text-foreground uppercase tracking-widest">Verarbeite Daten...</p>
                <p className="text-[11px] text-foreground/50 mt-1 font-sans">Gruppen werden zugeordnet und Artikel erstellt.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-secondary/10 border border-secondary/20 rounded-element">
                <div className="w-8 h-8 rounded-element bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-secondary uppercase tracking-wider">Erfolg</p>
                  <p className="text-[11px] text-secondary font-mono mt-0.5">
                    {result.success} Artikel importiert, {result.groupsCreated} Gruppen neu erstellt.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest pl-1">Hinweise / Fehler</p>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-surface-0 rounded-element border border-outline">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-[10px] text-primary font-mono font-bold uppercase">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-2.5 rounded-element bg-primary text-white dark:text-black dark:font-extrabold font-mono font-bold text-xs uppercase tracking-widest hover:bg-primary-hover shadow-sm transition-colors"
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
