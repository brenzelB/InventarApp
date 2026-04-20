"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArticleTable } from "@/modules/articles/components/ArticleTable";
import { ArticleSearchFilters } from "@/modules/articles/components/ArticleSearchFilters";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { articleService } from "@/modules/articles/services/articleService";
import { QrCode, RefreshCcw, CheckCircle2, Loader2, Plus } from "lucide-react";
import { ArticleActionButtons } from "@/modules/articles/components/ArticleActionButtons";
import { useAuth } from "@/hooks/useAuth";

export default function ArticlesPage() {
  const { articles, loading, error, refetch } = useArticles();
  const { role } = useAuth();
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "price-asc": return a.verkaufspreis - b.verkaufspreis;
        case "price-desc": return b.verkaufspreis - a.verkaufspreis;
        case "stock-asc": return a.bestand - b.bestand;
        case "stock-desc": return b.bestand - a.bestand;
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

    return result;
  }, [articles, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black leading-7 text-slate-900 dark:text-white sm:truncate sm:tracking-tight">
            Artikelverwaltung
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Verwalte und überwache deinen gesamten Lagerbestand an einem zentralen Ort.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 md:ml-4 md:mt-0">
          <ArticleActionButtons articles={filteredArticles} onRefresh={refetch} />
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2" />

          {role !== 'viewer' && (
            <Link href="/dashboard/articles/new" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-6 py-3 text-sm font-black text-white dark:text-slate-900 shadow-xl hover:scale-[1.02] transition-all active:scale-95 group">
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
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-2xl border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Lade Artikel...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ArticleTable articles={filteredArticles} onDelete={refetch} />
          {filteredArticles.length === 0 && articles.length > 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 mt-8">
              <p className="text-slate-500 font-medium">Keine Artikel gefunden, die deinen Filtereinstellungen entsprechen.</p>
              <button 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-4 text-indigo-600 font-bold hover:underline"
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
