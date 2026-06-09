"use client";

import { useState } from "react";
import { importExportService, ColumnSetting } from "../services/importExportService";
import { ImportPreviewModal } from "./ImportPreviewModal";
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
  columnSettings?: ColumnSetting[];
}

export function ArticleActionButtons({ articles, onRefresh, columnSettings }: ArticleActionButtonsProps) {
  const [showImport, setShowImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    if (format === 'pdf') {
      importExportService.exportToPDF(articles);
    } else {
      importExportService.exportArticles(articles, format, columnSettings);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Template Download */}
      <button 
        onClick={() => importExportService.downloadTemplate(columnSettings)}
        className="flex items-center gap-2 px-4 py-2 rounded-element text-xs font-bold font-mono uppercase tracking-wider text-foreground/75 bg-surface-0 border border-outline hover:bg-surface-2 transition-all shadow-sm"
        title="Import-Vorlage herunterladen"
      >
        <FileDown className="w-4 h-4 text-foreground/50" />
        <span className="hidden sm:inline">Vorlage</span>
      </button>

      {/* Import Button */}
      <button 
        onClick={() => setShowImport(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-element text-xs font-bold font-mono uppercase tracking-widest text-foreground bg-surface-0 border border-outline hover:bg-surface-2 transition-all shadow-sm active:scale-95"
      >
        <Upload className="w-4 h-4 text-foreground/50" />
        <span>Import</span>
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-2 px-4 py-2 rounded-element text-xs font-bold font-mono uppercase tracking-widest text-white dark:text-black dark:font-extrabold bg-primary hover:bg-primary-hover shadow-sm border border-outline transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-current" />
          <span>Export</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
        </button>

        {showExportMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowExportMenu(false)} 
              />
            <div className="absolute right-0 mt-2 w-48 bg-widget rounded-card shadow-lg border border-outline py-2 z-20 bg-grid-pattern bg-opacity-5 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => handleExport('xlsx')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-foreground/75 hover:bg-surface-2 transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-secondary" />
                Excel (.xlsx)
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-foreground/75 hover:bg-surface-2 transition-colors text-left"
              >
                <Download className="w-4 h-4 text-primary" />
                CSV (.csv)
              </button>
              <div className="h-px bg-outline my-1 mx-2" />
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-foreground/75 hover:bg-surface-2 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-primary" />
                PDF Report
              </button>
            </div>
          </>
        )}
      </div>

      {showImport && (
        <ImportPreviewModal 
          onClose={() => setShowImport(false)} 
          onSuccess={() => {
            onRefresh();
          }} 
        />
      )}
    </div>
  );
}
