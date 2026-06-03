"use client";

import React from 'react';
import { Search, Filter, ArrowUpDown, Columns, Check } from 'lucide-react';
import { Article } from '../types';

interface ColumnSetting {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

interface ArticleSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  articles: Article[];
  columnSettings: ColumnSetting[];
  setColumnSettings: (settings: ColumnSetting[]) => void;
}

export function ArticleSearchFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  articles,
  columnSettings,
  setSortBy: _setSortBy, // not used here but part of props
  columnSettings: _columnSettings, // not used here but part of props
  setColumnSettings
}: ArticleSearchFiltersProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-end md:items-center justify-between bg-widget p-6 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
      
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-foreground/45" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen nach Name, SKU oder Beschreibung..."
          className="block w-full pl-10 pr-3 py-2 border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/35 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs shadow-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Status Filter */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-foreground/45" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-outline rounded-element bg-surface-0 text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none cursor-pointer"
          >
            <option value="all" className="bg-surface-0 text-foreground">Alle Artikel</option>
            <option value="low_stock" className="bg-surface-0 text-foreground">Niedriger Bestand</option>
            <option value="out_of_stock" className="bg-surface-0 text-foreground">Ausverkauft</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 md:flex-none min-w-[140px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ArrowUpDown className="h-4 w-4 text-foreground/45" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full pl-9 pr-8 py-2 border border-outline rounded-element bg-surface-0 text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary text-xs appearance-none cursor-pointer"
          >
            <option value="name-asc" className="bg-surface-0 text-foreground">Name (A-Z)</option>
            <option value="name-desc" className="bg-surface-0 text-foreground">Name (Z-A)</option>
            <option value="price-asc" className="bg-surface-0 text-foreground">Preis (Günstig zuerst)</option>
            <option value="price-desc" className="bg-surface-0 text-foreground">Preis (Teuer zuerst)</option>
            <option value="stock-asc" className="bg-surface-0 text-foreground">Bestand (Wenig zuerst)</option>
            <option value="stock-desc" className="bg-surface-0 text-foreground">Bestand (Viel zuerst)</option>
            <option value="newest" className="bg-surface-0 text-foreground">Neueste zuerst</option>
            <option value="manual" className="bg-surface-0 text-foreground">Manuelle Sortierung</option>
          </select>
        </div>

        {/* Column Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`
              group flex items-center h-9 px-3 rounded-element border transition-all duration-300 ease-in-out
              ${isMenuOpen 
                ? 'bg-primary text-white dark:text-black dark:font-extrabold border-outline shadow-sm' 
                : 'bg-surface-0 border-outline text-foreground/75 hover:bg-surface-2'}
            `}
          >
            <Columns className="w-4 h-4 flex-shrink-0" />
            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap text-[10px] font-bold font-mono uppercase tracking-widest">
              Spalten
            </span>
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-64 rounded-card bg-widget shadow-lg border border-outline z-50 p-4 bg-grid-pattern bg-opacity-5 animate-in fade-in zoom-in duration-200 origin-top-right">
                <h4 className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest mb-4 px-2">Sichtbare Spalten</h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {columnSettings.map((col: ColumnSetting) => (
                    <label 
                      key={col.key} 
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-element cursor-pointer transition-all border
                        ${col.visible ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'hover:bg-surface-2 border-transparent text-foreground/70'}
                      `}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-element border border-outline text-secondary focus:ring-secondary bg-surface-0"
                        checked={col.visible}
                        onChange={() => {
                          if (col.key === 'name' || col.key === 'actions') return; // Locked
                          const newSettings = columnSettings.map((c: ColumnSetting) => 
                            c.key === col.key ? { ...c, visible: !c.visible } : c
                          );
                          setColumnSettings(newSettings);
                        }}
                        disabled={col.key === 'name' || col.key === 'actions'}
                      />
                      <span className="text-xs font-bold font-mono uppercase tracking-wide">{col.label}</span>
                    </label>
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
