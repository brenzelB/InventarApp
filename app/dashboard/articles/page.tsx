"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArticleTable } from "@/modules/articles/components/ArticleTable";
import { ArticleSearchFilters } from "@/modules/articles/components/ArticleSearchFilters";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { articleService } from "@/modules/articles/services/articleService";
import { QrCode, RefreshCcw, CheckCircle2, Loader2 } from "lucide-react";

export default function ArticlesPage() {
  const { articles, loading, error, refetch } = useArticles();
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [qrUpdating, setQrUpdating] = useState(false);
  const [qrUpdateResult, setQrUpdateResult] = useState<string | null>(null);

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

  const handleUpdateQrCodes = async () => {
    if (!confirm("Möchtest du wirklich alle QR-Codes aktualisieren? Dies stellt sicher, dass sie auf die aktuelle Domain zeigen.")) return;
    try {
      setQrUpdating(true);
      setQrUpdateResult(null);
      const res = await articleService.backfillMissingQrCodes(true);
      setQrUpdateResult(res.message);
      // Resultat nach 5 Sekunden ausblenden
      setTimeout(() => setQrUpdateResult(null), 5000);
      refetch();
    } catch (err: any) {
      alert("Fehler beim Aktualisieren: " + err.message);
    } finally {
      setQrUpdating(false);
    }
  };

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
        <div className="mt-4 flex items-center md:ml-4 md:mt-0 gap-3">
          <button 
            onClick={handleUpdateQrCodes}
            disabled={qrUpdating}
            title="Alle QR-Codes auf die aktuelle Domain aktualisieren"
            className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {qrUpdating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <RefreshCcw className="w-4 h-4 text-indigo-600" />}
            <span className="hidden sm:inline">QR-Codes aktualisieren</span>
          </button>

          <Link href="/dashboard/articles/new" className="inline-flex items-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all active:scale-95">
            Neuer Artikel
          </Link>
        </div>
      </div>

      {qrUpdateResult && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {qrUpdateResult}
        </div>
      )}

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
