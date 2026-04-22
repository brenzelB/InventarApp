"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Group, Article } from '../types';
import { articleService } from '../services/articleService';
import { 
  X, 
  Search, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Package
} from 'lucide-react';

interface GroupEditModalProps {
  group: Group;
  onClose: () => void;
  onSave: (updatedGroup: Group) => void;
}

export function GroupEditModal({ group, onClose, onSave }: GroupEditModalProps) {
  const [name, setName] = useState(group.name);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const articles = await articleService.getArticles();
        setAllArticles(articles);
        
        // Initial selected: articles that belong to THIS group
        const initialSelected = articles
          .filter(a => a.group_id === group.id)
          .map(a => a.id);
        setSelectedArticleIds(initialSelected);
      } catch (err: any) {
        setError("Fehler beim Laden der Artikel.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [group.id]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return allArticles;
    const term = searchTerm.toLowerCase();
    return allArticles.filter(a => 
      a.name.toLowerCase().includes(term) || 
      a.sku.toLowerCase().includes(term)
    );
  }, [allArticles, searchTerm]);

  const toggleArticle = (id: string) => {
    setSelectedArticleIds(prev => 
      prev.includes(id) 
        ? prev.filter(aId => aId !== id) 
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Determine changes in assignments
      const initiallyAssigned = allArticles
        .filter(a => a.group_id === group.id)
        .map(a => a.id);
      
      const toAssign = selectedArticleIds.filter(id => !initiallyAssigned.includes(id));
      const toUnassign = initiallyAssigned.filter(id => !selectedArticleIds.includes(id));

      // 2. Perform updates sequentially or in parallel depending on scale
      // Map-Update (Rename group)
      const updatedGroup = name !== group.name 
        ? await groupService_update(group.id, name.trim()) 
        : group;

      // Update assignments
      if (toAssign.length > 0) {
        await articleService.updateArticlesGroup(toAssign, group.id);
      }
      if (toUnassign.length > 0) {
        await articleService.updateArticlesGroup(toUnassign, null);
      }

      onSave({ ...group, name: name.trim() });
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper because it's imported in parent usually but we need it here
  // Actually, I'll use the service I already have
  const groupService_update = async (id: string, newName: string) => {
    const { groupService } = await import('../services/groupService');
    return await groupService.updateGroup(id, newName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-100/50 dark:ring-slate-800/50">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tight">
            {group.name} ({selectedArticleIds.length} Artikel)
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-colors">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest pl-1">Gruppenname</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Name der Gruppe..."
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest pl-1">Artikel verwalten</label>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-accent dark:text-indigo-300 rounded-full uppercase tracking-widest ring-1 ring-accent/10">
                {selectedArticleIds.length} zugewiesen
              </span>
            </div>

            {/* Article Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Artikel suchen..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-bold"
              />
            </div>

            {/* Article List */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 max-h-64 overflow-y-auto bg-slate-50/20 dark:bg-slate-950/20">
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lade Artikel...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 font-bold italic text-sm">
                  Keine Artikel gefunden.
                </div>
              ) : (
                filteredArticles.map(article => {
                  const isChecked = selectedArticleIds.includes(article.id);
                  const inOtherGroup = article.group_id && article.group_id !== group.id;
                  
                  return (
                    <label 
                      key={article.id} 
                      className={`flex items-center gap-8 px-4 py-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArticle(article.id)}
                        className="w-5 h-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-accent focus:ring-accent transition-all cursor-pointer bg-white dark:bg-slate-950"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{article.name}</p>
                        </div>
                        <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{article.sku}</p>
                      </div>
                      {inOtherGroup && (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-black uppercase tracking-widest ring-1 ring-amber-600/10">
                          Andere Gruppe
                        </span>
                      )}
                      {isChecked && !inOtherGroup && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="p-8 bg-red-50 dark:bg-rose-900/20 border border-red-100 dark:border-rose-800 rounded-2xl flex items-center gap-4 text-red-700 dark:text-rose-400 text-xs font-bold uppercase tracking-widest">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 uppercase tracking-widest transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
            Änderungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}
