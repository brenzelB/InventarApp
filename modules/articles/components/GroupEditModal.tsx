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
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Gruppe bearbeiten
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gruppenname</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium transition-all"
              placeholder="Name der Gruppe..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Artikel verwalten</label>
              <span className="text-xs font-bold px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                {selectedArticleIds.length} zugewiesen
              </span>
            </div>

            {/* Article Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Artikel suchen..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
            </div>

            {/* Article List */}
            <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/50 max-h-64 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/10">
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-medium text-slate-400">Lade Artikel...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm italic">
                  Keine Artikel gefunden.
                </div>
              ) : (
                filteredArticles.map(article => {
                  const isChecked = selectedArticleIds.includes(article.id);
                  const inOtherGroup = article.group_id && article.group_id !== group.id;
                  
                  return (
                    <label 
                      key={article.id} 
                      className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors ${isChecked ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArticle(article.id)}
                        className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-600 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{article.name}</p>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">{article.sku}</p>
                      </div>
                      {inOtherGroup && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full font-bold">
                          In anderer Gruppe
                        </span>
                      )}
                      {isChecked && !inOtherGroup && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Änderungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}
