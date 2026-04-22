"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { groupService } from '@/modules/articles/services/groupService';
import { articleService } from '@/modules/articles/services/articleService';
import { Group, Article } from '@/modules/articles/types';
import { GroupEditModal } from '@/modules/articles/components/GroupEditModal';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGroupId = searchParams.get('id');

  // Load view mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('groupsViewMode');
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    }
  }, []);

  // Persist view mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('groupsViewMode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, articlesData] = await Promise.all([
        groupService.getGroups(),
        articleService.getArticles()
      ]);
      setGroups(groupsData);
      setArticles(articlesData);
      
      // Update selected group if it's currently open to reflect any name changes or article assignment changes
      if (selectedGroup) {
        const updated = groupsData.find(g => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Daten.');
    } finally {
      setLoading(false);
    }
  };

  // Handle initial group selection from URL
  useEffect(() => {
    if (initialGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === initialGroupId);
      if (group) setSelectedGroup(group);
    }
  }, [initialGroupId, groups]);

  const getArticleCount = (groupId: string) => {
    return articles.filter(a => a.group_id === groupId).length;
  };

  const getGroupArticles = (groupId: string) => {
    return articles.filter(a => a.group_id === groupId);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newGroup = await groupService.createGroup(newGroupName.trim());
      setGroups(prev => [...prev, newGroup].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGroupName('');
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Gruppe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening detail view
    if (!confirm('Gruppe wirklich löschen? Zugeordnete Artikel bleiben bestehen, verlieren aber ihre Zuweisung.')) return;
    performDelete(id);
  };

  const performDelete = async (id: string) => {
    try {
      setIsSubmitting(true);
      await groupService.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      if (selectedGroup?.id === id) setSelectedGroup(null);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Gruppe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation(); // Prevent opening detail view (already handled if needed)
    setEditingGroup(group);
  };

  const onSaveGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g).sort((a, b) => a.name.localeCompare(b.name)));
    // Refresh articles to update counts and list
    loadData();
    setEditingGroup(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Breadcrumbs / Title */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          {selectedGroup ? (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedGroup(null)}
                className="flex items-center gap-2 text-sm font-bold text-accent hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Übersicht
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100 flex items-center gap-8">
                  <Folder className="w-10 h-10 text-accent" />
                  {selectedGroup.name}
                </h2>
                <button 
                  onClick={() => setEditingGroup(selectedGroup)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-md dark:hover:bg-slate-800 transition-all ring-1 ring-slate-100 dark:ring-slate-800"
                >
                  <Edit3 className="w-4 h-4 text-accent" />
                  Gruppe verwalten
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:truncate sm:tracking-tight uppercase">
                Gruppenverwaltung
              </h2>
              <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                Erstelle Kategorien wie 'Werkzeuge' oder 'Zubehör', um deine Artikel besser zu strukturieren.
              </p>
            </>
          )}
        </div>
        
        {/* Only show View Toggle in List View */}
        {!selectedGroup && (
          <div className="mt-4 md:mt-0 flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-3xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {!selectedGroup && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm ring-1 ring-slate-100/50 dark:ring-slate-800/50">
          <form onSubmit={handleCreateGroup} className="flex gap-8">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Folder className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Neue Gruppe (z.B. Büromaterial)..."
                disabled={isSubmitting}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm transition-all font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newGroupName.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-2xl font-bold text-sm hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Hinzufügen
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="p-8 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-8">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-slate-500 font-medium">Lade Daten...</p>
        </div>
      ) : selectedGroup ? (
        /* DETAIL VIEW */
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden ring-1 ring-slate-100/50 dark:ring-slate-800/50">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tight">
                Zugeordnete Artikel
                <span className="ml-2 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-accent dark:text-indigo-300 rounded-full text-[10px] font-bold uppercase ring-1 ring-accent/10">
                  {getGroupArticles(selectedGroup.id).length}
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-white dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">SKU</th>
                    <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Bestand</th>
                    <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Preis</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-950">
                  {getGroupArticles(selectedGroup.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold italic text-sm">
                        Keine Artikel in dieser Gruppe gefunden. Klicke auf 'Gruppe verwalten', um Artikel zuzuweisen.
                      </td>
                    </tr>
                  ) : (
                    getGroupArticles(selectedGroup.id).map((article) => (
                      <tr 
                        key={article.id} 
                        onClick={() => router.push(`/dashboard/articles/${article.id}?fromGroup=${selectedGroup.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer group/row"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-slate-100 group-hover/row:text-accent transition-colors">
                          {article.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
                          {article.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex px-2 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider ${article.bestand <= article.mindestbestand ? 'bg-red-50 dark:bg-rose-900/30 text-red-700 dark:text-rose-400 ring-1 ring-red-600/10' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/10'}`}>
                            {article.bestand}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-900 dark:text-slate-100">
                          {Number(article.verkaufspreis).toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Eye className="w-4 h-4 text-slate-400 group-hover/row:text-accent transition-colors" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 ring-1 ring-slate-100/50 dark:ring-slate-800/50">
          <Folder className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-bold">Noch keine Gruppen erstellt.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {groups.map((group) => (
            <div 
              key={group.id} 
              onClick={() => setSelectedGroup(group)}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative overflow-hidden ring-1 ring-slate-100/50 dark:ring-slate-800/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl ring-1 ring-accent/10">
                  <Folder className="w-5 h-5 text-accent" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleEditClick(e, group)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-accent dark:hover:text-accent transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteGroup(e, group.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-rose-900/30 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {group.name}
              </h3>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {getArticleCount(group.id)} Artikel
                </p>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300 ring-1 ring-slate-100/50 dark:ring-slate-800/50">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Gruppe</th>
                <th scope="col" className="px-6 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Artikel</th>
                <th scope="col" className="px-6 py-4 text-right text-[11px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-950">
              {groups.map((group) => (
                <tr 
                  key={group.id} 
                  onClick={() => setSelectedGroup(group)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-slate-100">
                    <div className="flex items-center">
                      <Folder className="w-4 h-4 text-accent mr-3" />
                      {group.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-accent dark:text-indigo-300 uppercase tracking-widest ring-1 ring-accent/10">
                      {getArticleCount(group.id)} Artikel
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => handleEditClick(e, group)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-accent dark:hover:text-accent hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteGroup(e, group.id)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/30 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editingGroup || (selectedGroup && editingGroup)) && (
        <GroupEditModal 
          group={editingGroup || selectedGroup!}
          onClose={() => setEditingGroup(null)}
          onSave={onSaveGroup}
        />
      )}
    </div>
  );
}
