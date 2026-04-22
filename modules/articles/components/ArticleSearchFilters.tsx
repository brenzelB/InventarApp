"use client";

import React from 'react';
import { Search, Filter, ArrowUpDown, Columns, Check } from 'lucide-react';
import { Article } from '../types';

interface ArticleSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  articles: Article[];
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
}

const COLUMN_LABELS: Record<string, string> = {
  qr_code: "QR",
  description: "Beschreibung",
  sku: "SKU",
  lagerort: "Lagerort",
  bestand: "Bestand",
  purchase_price: "EK-Preis",
  verkaufspreis: "VK-Preis",
  herstellpreis: "Herstellpreis",
  tax_rate: "Steuer",
  unit: "Einheit",
  mindestbestand: "Min-Bestand",
};

export function ArticleSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  articles,
  visibleColumns,
  setVisibleColumns
}: ArticleSearchFiltersProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Detect dynamic columns from the first article
  const availableFields = React.useMemo(() => {
    if (articles.length === 0) return Object.keys(COLUMN_LABELS);
    
    const articleKeys = Object.keys(articles[0]);
    const fields = articleKeys.filter(key => 
      COLUMN_LABELS[key] && !['id', 'name', 'group_id', 'group', 'created_at', 'updated_at'].includes(key)
    );
    
    // Ensure all defined labels are present if they exist in the schema
    return Array.from(new Set([...fields, ...Object.keys(COLUMN_LABELS).filter(k => articleKeys.includes(k))]));
  }, [articles]);

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      setVisibleColumns(visibleColumns.filter(c => c !== key));
    } else {
      setVisibleColumns([...visibleColumns, key]);
    }
  };
  return (
    <div className="flex flex-col md:flex-row gap-8 items-end md:items-center justify-between bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800/50">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen nach Name, SKU oder Beschreibung..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Status Filter */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm appearance-none cursor-pointer"
          >
            <option value="all" className="dark:bg-slate-900">Alle Artikel</option>
            <option value="low_stock" className="dark:bg-slate-900">Niedriger Bestand</option>
            <option value="out_of_stock" className="dark:bg-slate-900">Ausverkauft</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm appearance-none cursor-pointer"
          >
            <option value="name-asc" className="dark:bg-slate-900">Name (A-Z)</option>
            <option value="name-desc" className="dark:bg-slate-900">Name (Z-A)</option>
            <option value="price-asc" className="dark:bg-slate-900">Preis (Günstig zuerst)</option>
            <option value="price-desc" className="dark:bg-slate-900">Preis (Teuer zuerst)</option>
            <option value="stock-asc" className="dark:bg-slate-900">Bestand (Wenig zuerst)</option>
            <option value="stock-desc" className="dark:bg-slate-900">Bestand (Viel zuerst)</option>
            <option value="newest" className="dark:bg-slate-900">Neueste zuerst</option>
            <option value="manual" className="dark:bg-slate-900">Manuelle Sortierung</option>
          </select>
        </div>

        {/* Column Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`
              group flex items-center h-10 px-3 rounded-full transition-all duration-300 ease-in-out
              ${isMenuOpen 
                ? 'bg-accent text-white shadow-lg' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}
            `}
          >
            <Columns className="w-5 h-5 flex-shrink-0" />
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-black uppercase tracking-widest">
              Spalten anpassen
            </span>
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sichtbare Spalten</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {availableFields.map((field) => (
                    <button
                      key={field}
                      onClick={() => toggleColumn(field)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                    >
                      <span className={`text-sm font-bold ${visibleColumns.includes(field) ? 'text-accent dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {COLUMN_LABELS[field]}
                      </span>
                      {visibleColumns.includes(field) && (
                        <Check className="w-4 h-4 text-accent dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
