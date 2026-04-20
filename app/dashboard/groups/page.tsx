"use client";

import React, { useState, useEffect } from 'react';
import { groupService } from '@/modules/articles/services/groupService';
import { Group } from '@/modules/articles/types';
import { GroupEditModal } from '@/modules/articles/components/GroupEditModal';
import { 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Gruppen.');
    } finally {
      setLoading(false);
    }
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

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Gruppe wirklich löschen? Zugeordnete Artikel bleiben bestehen, verlieren aber ihre Zuweisung.')) return;
    try {
      setIsSubmitting(true);
      await groupService.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Gruppe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingGroup(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black leading-7 text-slate-900 dark:text-white sm:truncate sm:tracking-tight">
            Gruppenverwaltung
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Erstelle Kategorien wie 'Werkzeuge' oder 'Zubehör', um deine Artikel besser zu strukturieren.
          </p>
        </div>
      </div>

      {/* Create New Group Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleCreateGroup} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Folder className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              required
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Neue Gruppe (z.B. Büromaterial)..."
              disabled={isSubmitting}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newGroupName.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Hinzufügen
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Lade Gruppen...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Noch keine Gruppen erstellt.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div 
              key={group.id} 
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                    onClick={() => setEditingGroup(group)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {group.name}
              </h3>
            </div>
          ))
        )}
      </div>

      {editingGroup && (
        <GroupEditModal 
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={onSaveGroup}
        />
      )}
    </div>
  );
}

    </div>
  );
}
