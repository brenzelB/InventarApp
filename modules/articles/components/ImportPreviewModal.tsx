"use client";

import { useState, useRef, useCallback } from "react";
import { importExportService } from "../services/importExportService";
import { useToast } from "@/hooks/useToast";
import {
  Loader2,
  Upload,
  FileCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Table2,
  Tag,
  ArrowRight,
} from "lucide-react";

interface ImportPreviewModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = "idle" | "preview" | "importing" | "done";

interface PreviewData {
  rows: Record<string, any>[];
  headers: string[];
  totalCount: number;
}

interface ImportResult {
  success: number;
  groupsCreated: number;
  errors: string[];
}

const MANDATORY_FIELDS = ["Name"];

export function ImportPreviewModal({ onClose, onSuccess }: ImportPreviewModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  // --- File handling ---
  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setState("preview");
    try {
      const data = await importExportService.parseExcelPreview(file);
      setPreviewData(data);
    } catch (err: any) {
      toastError(err.message || "Datei konnte nicht gelesen werden.");
      setState("idle");
    }
  }, [toastError]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // --- Import confirmation ---
  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setState("importing");
    try {
      const res = await importExportService.importFromExcel(selectedFile);
      setResult(res);
      setState("done");
      if (res.success > 0) {
        onSuccess();
        toastSuccess(
          `Import erfolgreich: ${res.success} Artikel ${res.success === 1 ? "aktualisiert/neu angelegt" : "aktualisiert/neu angelegt"}.`
        );
      }
    } catch (err: any) {
      setResult({ success: 0, groupsCreated: 0, errors: [err.message || "Import fehlgeschlagen"] });
      setState("done");
      toastError(err.message || "Import fehlgeschlagen.");
    }
  };

  // --- Validation ---
  const missingMandatory =
    previewData
      ? MANDATORY_FIELDS.filter((f) => !previewData.headers.includes(f))
      : [];
  const canConfirm = previewData && previewData.totalCount > 0 && missingMandatory.length === 0;

  const previewRows = previewData?.rows.slice(0, 5) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/85 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div className="bg-widget rounded-card shadow-lg w-full max-w-3xl overflow-hidden border border-outline bg-grid-pattern bg-opacity-5 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-6 border-b border-outline flex justify-between items-center bg-surface-2 dark:bg-surface-2/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-element bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-sora uppercase tracking-wide">
                [ IMPORT_PREVIEW ] Import Vorschau
              </h3>
              <p className="text-[11px] text-foreground/50 font-sans">
                Prüfe deine Daten, bevor sie importiert werden.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-2 rounded-element transition-colors"
          >
            <X className="w-4 h-4 text-foreground/45" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">

          {/* ── IDLE: Drop zone ── */}
          {state === "idle" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer border border-dashed rounded-element p-10 flex flex-col items-center justify-center gap-6 transition-all bg-surface-0
                ${isDragging
                  ? "border-primary bg-primary/5"
                  : "border-outline hover:border-primary hover:bg-primary/5"
                }`}
            >
              <div className="w-12 h-12 rounded-element bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground font-sora">
                  Excel-Datei auswählen
                </p>
                <p className="text-xs text-foreground/60 mt-1 font-sans">Klicken oder Datei hierher ziehen</p>
                <p className="text-[10px] font-mono text-foreground/45 mt-2">.xlsx, .xls</p>
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

          {/* ── PREVIEW ── */}
          {state === "preview" && previewData && (
            <div className="space-y-5">

              {/* Summary chip */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-element bg-secondary/10 border border-secondary/20">
                  <Table2 className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-bold font-mono text-secondary uppercase tracking-wider">
                    {previewData.totalCount} {previewData.totalCount === 1 ? "Artikel" : "Artikel"} in der Datei gefunden
                  </span>
                </div>
                {selectedFile && (
                  <span className="text-xs font-bold font-mono text-foreground/45 truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              {/* Detected columns */}
              <div className="p-4 rounded-element bg-surface-2 border border-outline">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-foreground/50" />
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest">
                    Erkannte Felder
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewData.headers.map((h) => (
                    <span
                      key={h}
                      className={`inline-flex items-center px-2 py-0.5 rounded-element text-[9px] font-bold font-mono uppercase border
                        ${MANDATORY_FIELDS.includes(h)
                          ? "bg-secondary/15 text-secondary border-secondary/20"
                          : "bg-surface-0 border-outline text-foreground/75"
                        }`}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing mandatory field error */}
              {missingMandatory.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-element bg-primary/10 border border-primary/20">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold font-mono text-primary uppercase">
                      Pflichtfeld fehlt
                    </p>
                    <p className="text-[11px] text-primary/80 mt-0.5">
                      Die Spalte <strong>"{missingMandatory.join('", "')}"</strong> wurde in der Datei nicht gefunden.
                      Der Import kann nicht gestartet werden.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-2 pl-1">
                    Vorschau (erste {previewRows.length} Zeilen)
                  </p>
                  <div className="overflow-x-auto rounded-card border border-outline overflow-hidden bg-surface-0">
                    <table className="min-w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-surface-2 dark:bg-surface-2/40 border-b border-outline">
                          {previewData.headers.map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2.5 text-left font-bold font-mono text-foreground/70 uppercase tracking-widest text-[9px] border-r border-outline last:border-r-0 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline bg-transparent">
                        {previewRows.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-surface-2/30 transition-all border-b border-outline last:border-0"
                          >
                            {previewData.headers.map((h) => (
                              <td
                                key={h}
                                className="px-3 py-2 text-foreground/80 font-mono text-[10px] border-r border-outline last:border-r-0 whitespace-nowrap max-w-[180px] truncate"
                                title={String(row[h] ?? "")}
                              >
                                {row[h] !== undefined && row[h] !== null
                                  ? String(row[h])
                                  : <span className="text-foreground/30 font-bold">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.totalCount > 5 && (
                    <p className="text-[10px] text-foreground/50 font-mono mt-2 pl-1">
                      … und {previewData.totalCount - 5} weitere Zeilen
                  </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground hover:bg-surface-2 rounded-element border border-transparent hover:border-outline transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!canConfirm}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-element text-xs font-bold text-white dark:text-black dark:font-extrabold transition-all border font-mono uppercase tracking-widest
                    ${canConfirm
                      ? "bg-primary hover:bg-primary-hover border-outline shadow-sm"
                      : "bg-surface-0 border-outline text-foreground/40 cursor-not-allowed"
                    }`}
                >
                  Import jetzt starten
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {state === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-outline border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-surface-0" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold font-mono text-foreground uppercase tracking-widest">
                  Importiere Daten…
                </p>
                <p className="text-[11px] text-foreground/50 mt-1 font-sans">
                  Gruppen werden zugeordnet und Artikel erstellt.
                </p>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {state === "done" && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-secondary/10 border border-secondary/20 rounded-element">
                <div className="w-8 h-8 rounded-element bg-secondary/20 text-secondary flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-secondary uppercase tracking-wider">
                    Import abgeschlossen
                  </p>
                  <p className="text-[11px] text-secondary font-mono mt-0.5">
                    <strong>{result.success}</strong> Artikel importiert
                    {result.groupsCreated > 0 && `, ${result.groupsCreated} neue Gruppe${result.groupsCreated > 1 ? "n" : ""} angelegt`}.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest pl-1">
                    Hinweise / Fehler
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-3 bg-surface-0 rounded-element border border-outline">
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
