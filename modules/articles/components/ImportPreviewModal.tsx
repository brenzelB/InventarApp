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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Import Vorschau
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Prüfe deine Daten, bevor sie importiert werden.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
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
              className={`group cursor-pointer border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-6 transition-all
                ${isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Excel-Datei auswählen
                </p>
                <p className="text-sm text-slate-500 mt-1">Klicken oder Datei hierher ziehen</p>
                <p className="text-xs text-slate-400 mt-2">.xlsx, .xls</p>
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                  <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-black text-blue-800 dark:text-blue-300">
                    {previewData.totalCount} {previewData.totalCount === 1 ? "Artikel" : "Artikel"} in der Datei gefunden
                  </span>
                </div>
                {selectedFile && (
                  <span className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              {/* Detected columns */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Erkannte Felder
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewData.headers.map((h) => (
                    <span
                      key={h}
                      className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold
                        ${MANDATORY_FIELDS.includes(h)
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800/50"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing mandatory field error */}
              {missingMandatory.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-rose-700 dark:text-rose-400">
                      Pflichtfeld fehlt
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-0.5">
                      Die Spalte <strong>"{missingMandatory.join('", "')}"</strong> wurde in der Datei nicht gefunden.
                      Der Import kann nicht gestartet werden.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Vorschau (erste {previewRows.length} Zeilen)
                  </p>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/70">
                          {previewData.headers.map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2.5 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewRows.map((row, i) => (
                          <tr
                            key={i}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {previewData.headers.map((h) => (
                              <td
                                key={h}
                                className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap max-w-[180px] truncate"
                                title={String(row[h] ?? "")}
                              >
                                {row[h] !== undefined && row[h] !== null
                                  ? String(row[h])
                                  : <span className="text-slate-300 dark:text-slate-600">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.totalCount > 5 && (
                    <p className="text-[11px] text-slate-400 font-medium mt-2 pl-1">
                      … und {previewData.totalCount - 5} weitere Zeilen
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!canConfirm}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95
                    ${canConfirm
                      ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)]"
                      : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
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
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Importiere Daten…
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Gruppen werden zugeordnet und Artikel erstellt.
                </p>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {state === "done" && result && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                    Import abgeschlossen
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                    <strong>{result.success}</strong> Artikel importiert
                    {result.groupsCreated > 0 && `, ${result.groupsCreated} neue Gruppe${result.groupsCreated > 1 ? "n" : ""} angelegt`}.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Hinweise / Fehler
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-[11px] text-rose-500 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95"
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
