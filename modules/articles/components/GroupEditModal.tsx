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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/85 backdrop-blur-[4px] animate-in fade-in duration-300">
      <div className="bg-widget w-full max-w-2xl rounded-card shadow-lg border border-outline overflow-hidden flex flex-col max-h-[90vh] bg-grid-pattern bg-opacity-5 transition-all duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline flex items-center justify-between bg-surface-2 dark:bg-surface-2/40">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide font-sora">
            [ GROUP_EDIT ] {group.name} ({selectedArticleIds.length} Artikel)
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-element transition-colors">
            <X className="w-4 h-4 text-foreground/45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest pl-1">Gruppenname</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full block border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2.5 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm"
              placeholder="Name der Gruppe..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest pl-1">Artikel verwalten</label>
              <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 bg-secondary/15 text-secondary border border-secondary/20 rounded-element">
                {selectedArticleIds.length} zugewiesen
              </span>
            </div>

            {/* Article Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/45" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Artikel suchen..."
                className="w-full pl-10 pr-4 py-2 border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono font-bold text-xs shadow-sm"
              />
            </div>

            {/* Article List */}
            <div className="border border-outline rounded-element overflow-hidden divide-y divide-outline max-h-64 overflow-y-auto bg-surface-0/50">
              {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest font-mono">Lade Artikel...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="py-10 text-center text-foreground/40 font-bold italic text-xs font-mono uppercase">
                  Keine Artikel gefunden.
                </div>
              ) : (
                filteredArticles.map(article => {
                  const isChecked = selectedArticleIds.includes(article.id);
                  const inOtherGroup = article.group_id && article.group_id !== group.id;
                  
                  return (
                    <label 
                      key={article.id} 
                      className={`flex items-center gap-8 px-4 py-3 cursor-pointer hover:bg-surface-2/40 transition-colors ${isChecked ? 'bg-secondary/5' : ''}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArticle(article.id)}
                        className="w-4 h-4 rounded-element border border-outline text-secondary focus:ring-secondary transition-all cursor-pointer bg-surface-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-foreground/40" />
                          <p className="text-xs font-bold text-foreground truncate font-sora">{article.name}</p>
                        </div>
                        <p className="text-[9px] font-mono font-bold text-foreground/45 uppercase tracking-wide">{article.sku}</p>
                      </div>
                      {inOtherGroup && (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-element font-bold uppercase tracking-wider border border-amber-500/20">
                          Andere Gruppe
                        </span>
                      )}
                      {isChecked && !inOtherGroup && (
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-element flex items-center gap-4 text-primary text-xs font-bold font-mono uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-2/40 border-t border-outline flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground hover:bg-surface-2 rounded-element border border-transparent hover:border-outline transition-colors"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white dark:text-black dark:font-extrabold rounded-element border border-outline font-bold text-xs uppercase tracking-widest hover:bg-primary-hover shadow-sm transition-all"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : <Save className="w-4 h-4 text-current" />}
            Änderungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}
