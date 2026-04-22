"use client";

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface ArticleSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export function ArticleSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy
}: ArticleSearchFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-white dark:bg-widget p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen nach Name, SKU oder Beschreibung..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-widget text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent sm:text-sm transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Status Filter */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-widget text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm appearance-none cursor-pointer"
          >
            <option value="all">Alle Artikel</option>
            <option value="low_stock">Niedriger Bestand</option>
            <option value="out_of_stock">Ausverkauft</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-widget text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm appearance-none cursor-pointer"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Preis (Günstig zuerst)</option>
            <option value="price-desc">Preis (Teuer zuerst)</option>
            <option value="stock-asc">Bestand (Wenig zuerst)</option>
            <option value="stock-desc">Bestand (Viel zuerst)</option>
            <option value="newest">Neueste zuerst</option>
          </select>
        </div>
      </div>
    </div>
  );
}
