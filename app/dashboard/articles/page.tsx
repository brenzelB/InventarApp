"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArticleTable } from "@/modules/articles/components/ArticleTable";
import { ArticleSearchFilters } from "@/modules/articles/components/ArticleSearchFilters";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { articleService } from "@/modules/articles/services/articleService";
import { QrCode, RefreshCcw, CheckCircle2, Loader2, Plus } from "lucide-react";
import { ArticleActionButtons } from "@/modules/articles/components/ArticleActionButtons";
import { useAuth } from "@/hooks/useAuth";
import { getArticleGridConfig, saveArticleGridConfig } from "@/app/dashboard/actions";

interface ColumnSetting {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

interface GridConfig {
  column_config: ColumnSetting[];
  row_order: string[];
}

export default function ArticlesPage() {
  const { articles, loading, error, refetch } = useArticles();
  const { role, user } = useAuth();
  
  // Column & Sorting State
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([]);
  const [rowOrder, setRowOrder] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function loadConfig() {
      const defaultSettings: ColumnSetting[] = [
        { key: 'qr_code', label: 'QR', width: 80, visible: true },
        { key: 'name', label: 'Name', width: 250, visible: true },
        { key: 'description', label: 'Beschreibung', width: 200, visible: true },
        { key: 'sku', label: 'SKU', width: 120, visible: true },
        { key: 'lagerort', label: 'Lagerort', width: 120, visible: true },
        { key: 'bestand', label: 'Bestand', width: 150, visible: true },
        { key: 'purchase_price', label: 'EK-Preis', width: 120, visible: true },
        { key: 'verkaufspreis', label: 'VK-Preis', width: 120, visible: true },
        { key: 'herstellpreis', label: 'Herstellpreis', width: 120, visible: false },
        { key: 'tax_rate', label: 'Steuer', width: 100, visible: false },
        { key: 'mindestbestand', label: 'Min-Bestand', width: 120, visible: false },
        { key: 'actions', label: 'Aktionen', width: 100, visible: true },
      ];

      if (user) {
        const { config } = await getArticleGridConfig(user.id);
        if (config) {
          if (config.column_config) setColumnSettings(config.column_config);
          if (config.row_order) setRowOrder(config.row_order);
          setIsInitialLoad(false);
          return;
        }
      }

      // Fallback to localStorage if no DB config or no user
      const savedColumns = localStorage.getItem('article_column_settings');
      const savedRowOrder = localStorage.getItem('article_sort_order');

      if (savedColumns) {
        try {
          setColumnSettings(JSON.parse(savedColumns));
        } catch (e) {
          setColumnSettings(defaultSettings);
        }
      } else {
        setColumnSettings(defaultSettings);
      }

      if (savedRowOrder) {
        try {
          setRowOrder(JSON.parse(savedRowOrder));
        } catch (e) {}
      }
      
      setIsInitialLoad(false);
    }

    loadConfig();
  }, [user]);

  // Debounced Sync to Database
  useEffect(() => {
    if (isInitialLoad || !user) return;

    const syncConfig = async () => {
      setIsSyncing(true);
      const config = {
        column_config: columnSettings,
        row_order: rowOrder
      };
      await saveArticleGridConfig(user.id, config);
      setIsSyncing(false);
    };

    const handler = setTimeout(syncConfig, 2000);
    return () => clearTimeout(handler);
  }, [columnSettings, rowOrder, user, isInitialLoad]);

  const handleUpdateColumns = (newSettings: ColumnSetting[]) => {
    setColumnSettings(newSettings);
    localStorage.setItem('article_column_settings', JSON.stringify(newSettings));
  };

  const handleRowReorder = (newOrder: string[]) => {
    setRowOrder(newOrder);
    localStorage.setItem('article_sort_order', JSON.stringify(newOrder));
  };

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article => 
        article.name.toLowerCase().includes(query) ||
        article.sku.toLowerCase().includes(query) ||
        (article.description && article.description.toLowerCase().includes(query))
      );
    }

    // 2. Status Filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "low_stock":
          result = result.filter(a => a.bestand <= a.mindestbestand && a.bestand > 0);
          break;
        case "out_of_stock":
          result = result.filter(a => a.bestand === 0);
          break;
      }
    }

    // 3. Sorting
    result.sort((a, b) => {
      // Manual Sorting Priority
      if (sortBy === 'manual' && rowOrder.length > 0) {
        const indexA = rowOrder.indexOf(a.id);
        const indexB = rowOrder.indexOf(b.id);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
      }

      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "price-asc": return a.verkaufspreis - b.verkaufspreis;
        case "price-desc": return b.verkaufspreis - a.verkaufspreis;
        case "stock-asc": return a.bestand - b.bestand;
        case "stock-desc": return b.bestand - a.bestand;
        case "newest": 
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        default: return 0;
      }
    });

    return result;
  }, [articles, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black leading-7 text-slate-900 dark:text-slate-100 sm:truncate sm:tracking-tight">
            Artikelverwaltung
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm font-bold text-slate-500">
              Verwalte und überwache deinen gesamten Lagerbestand an einem zentralen Ort.
            </p>
            {isSyncing && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-pulse border border-blue-100 dark:border-blue-800">
                <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
                Synchronisierung...
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-8 md:ml-4 md:mt-0">
          <ArticleActionButtons articles={filteredArticles} onRefresh={refetch} columnSettings={columnSettings} />
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block mx-2" />

          {role !== 'viewer' && (
            <Link href="/dashboard/articles/new" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-6 py-3 text-sm font-black text-white dark:text-slate-900 shadow-xl dark:shadow-none hover:scale-[1.02] transition-all active:scale-95 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Neuer Artikel
            </Link>
          )}
        </div>
      </div>

      <ArticleSearchFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        articles={articles}
        columnSettings={columnSettings}
        setColumnSettings={handleUpdateColumns}
      />

      {error && (
        <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-8">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Lade Artikel...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ArticleTable 
            articles={filteredArticles} 
            onDelete={refetch} 
            columnSettings={columnSettings}
            setColumnSettings={handleUpdateColumns}
            onRowReorder={handleRowReorder}
          />
          {filteredArticles.length === 0 && articles.length > 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 mt-8">
              <p className="text-slate-500 dark:text-slate-400 font-bold">Keine Artikel gefunden, die deinen Filtereinstellungen entsprechen.</p>
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-4 text-accent font-black hover:underline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
