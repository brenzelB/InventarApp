"use client";

import { useState } from "react";
import { importExportService } from "../services/importExportService";
import { ImportModal } from "./ImportModal";
import { Article } from "../types";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  ChevronDown 
} from "lucide-react";

interface ArticleActionButtonsProps {
  articles: Article[];
  onRefresh: () => void;
}

export function ArticleActionButtons({ articles, onRefresh }: ArticleActionButtonsProps) {
  const [showImport, setShowImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    if (format === 'pdf') {
      importExportService.exportToPDF(articles);
    } else {
      importExportService.exportArticles(articles, format);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Template Download */}
      <button 
        onClick={() => importExportService.downloadTemplate()}
        className="flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm dark:shadow-none"
        title="Import-Vorlage herunterladen"
      >
        <FileDown className="w-4 h-4" />
        <span className="hidden sm:inline">Vorlage</span>
      </button>

      {/* Import Button */}
      <button 
        onClick={() => setShowImport(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all shadow-sm dark:shadow-none active:scale-95"
      >
        <Upload className="w-4 h-4" />
        <span>Import</span>
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-black text-white bg-accent hover:bg-indigo-500 shadow-md dark:shadow-[0_8px_30px_rgb(59,130,246,0.2)] dark:ring-1 dark:ring-blue-500/20 hover:dark:shadow-[0_8px_30px_rgb(59,130,246,0.4)] border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
        </button>

        {showExportMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowExportMenu(false)} 
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 py-2 z-20 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => handleExport('xlsx')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Excel (.xlsx)
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-accent" />
                CSV (.csv)
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2" />
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF Report
              </button>
            </div>
          </>
        )}
      </div>

      {showImport && (
        <ImportModal 
          onClose={() => setShowImport(false)} 
          onSuccess={() => {
            onRefresh();
            // Modal stays open to show result, then user closes it
          }} 
        />
      )}
    </div>
  );
}
