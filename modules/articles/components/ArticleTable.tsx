"use client";

import Link from 'next/link';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { QRCodeView } from "@/components/QRCodeView";
import { 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  Loader2,
  GripVertical 
} from 'lucide-react';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface ArticleTableProps {
  articles: Article[];
  onDelete: () => void;
  visibleColumns: string[];
}

export function ArticleTable({ articles, onDelete, visibleColumns }: ArticleTableProps) {
  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { role } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

  // Sync with prop
  useEffect(() => {
    setLocalArticles(articles);
  }, [articles]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalArticles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newList = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('article_sort_order', JSON.stringify(newList.map(a => a.id)));
        return newList;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Artikel wirklich löschen?')) return;
    setDeletingId(id);
    try {
      await articleService.deleteArticle(id);
      toastSuccess("Artikel wurde erfolgreich gelöscht.");
      onDelete();
    } catch (err: any) {
      toastError(err.message || 'Fehler beim Löschen.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickAdjust = async (article: Article, delta: number) => {
    if (role === 'viewer') return;
    if (updatingId) return;

    const newBestand = Math.max(0, article.bestand + delta);
    if (newBestand === article.bestand) return;

    setUpdatingId(article.id);
    try {
      await articleService.updateArticle(article.id, { bestand: newBestand });
      toastSuccess(`${article.name}: Bestand auf ${newBestand} ${article.unit} aktualisiert.`);
      onDelete(); // Refresh list
    } catch (err: any) {
      toastError("Fehler beim Aktualisieren: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const startEditing = (article: Article) => {
    if (role === 'viewer') return;
    setEditingId(article.id);
    setEditValue(article.purchase_price?.toString() || "0");
  };

  const handlePriceSave = async (id: string) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) return;

    setUpdatingId(id);
    setEditingId(null);
    try {
      await articleService.updateArticle(id, { purchase_price: newValue });
      toastSuccess("Einkaufspreis aktualisiert.");
      // No need for onDelete() here if useArticles is reactive, but keeping it for safety
      onDelete(); 
    } catch (err: any) {
      toastError("Fehler: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <svg className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Keine Artikel gefunden</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Lege deinen ersten Artikel an.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-slate-200 dark:ring-slate-700 sm:rounded-2xl">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 table-auto">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th scope="col" className="w-8 px-3 py-4"></th>
            {visibleColumns.includes('qr_code') && (
              <th scope="col" className="py-4 pl-4 pr-3 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest sm:pl-6 w-16">QR</th>
            )}
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Name</th>
            {visibleColumns.includes('description') && (
              <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Beschreibung</th>
            )}
            {visibleColumns.includes('sku') && (
              <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">SKU</th>
            )}
            {visibleColumns.includes('lagerort') && (
              <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Lagerort</th>
            )}
            {visibleColumns.includes('bestand') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Bestand</th>
            )}
            {visibleColumns.includes('purchase_price') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">EK-Preis</th>
            )}
            {visibleColumns.includes('verkaufspreis') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">VK-Preis</th>
            )}
            {visibleColumns.includes('herstellpreis') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Herstellpreis</th>
            )}
            {visibleColumns.includes('tax_rate') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Steuer</th>
            )}
            {visibleColumns.includes('mindestbestand') && (
              <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest">Min-Bestand</th>
            )}
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest w-px whitespace-nowrap">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={localArticles.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {localArticles.map((article, index) => (
                <SortableRow 
                  key={article.id}
                  article={article}
                  index={index}
                  visibleColumns={visibleColumns}
                  role={role}
                  updatingId={updatingId}
                  deletingId={deletingId}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  handleQuickAdjust={handleQuickAdjust}
                  startEditing={startEditing}
                  handlePriceSave={handlePriceSave}
                  setEditingId={setEditingId}
                  handleDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </tbody>
      </table>
    </div>
  );
}

function SortableRow({ 
  article, 
  index, 
  visibleColumns, 
  role, 
  updatingId, 
  deletingId, 
  editingId, 
  editValue, 
  setEditValue, 
  handleQuickAdjust, 
  startEditing, 
  handlePriceSave, 
  setEditingId, 
  handleDelete 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as any,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`
        hover:bg-slate-50 dark:hover:bg-slate-900 transition-all groups
        animate-in fade-in slide-in-from-left-4 duration-500
        ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 shadow-2xl ring-2 ring-blue-500/50 z-50' : ''}
      `}
    >
      <td className="px-3 py-4 w-8">
        <button 
          {...attributes} 
          {...listeners}
          className="p-1 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing hover:text-blue-500 transition-colors"
        >
          <GripVertical size={16} />
        </button>
      </td>
      {visibleColumns.includes('qr_code') && (
        <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6 w-16">
          <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="sm" />
        </td>
      )}
      <td className="px-3 py-4 text-sm font-bold">
        <Link href={`/dashboard/articles/${article.id}`} className="text-slate-900 dark:text-slate-100 hover:text-accent transition-colors block truncate max-w-xs md:max-w-md">
          {article.name}
        </Link>
        {article.group && (
          <span className="inline-flex mt-1 items-center rounded-3xl bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
            {article.group.name}
          </span>
        )}
      </td>
      {visibleColumns.includes('description') && (
        <td className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium max-w-xs truncate" title={article.description || ''}>
          {article.description || "—"}
        </td>
      )}
      {visibleColumns.includes('sku') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-bold font-mono">{article.sku}</td>
      )}
      {visibleColumns.includes('lagerort') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{article.lagerort || "—"}</td>
      )}
      {visibleColumns.includes('bestand') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
          <div className="flex items-center justify-end gap-2 group/stock">
            {role !== 'viewer' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-0.5 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleQuickAdjust(article, -1)}
                  className="p-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  disabled={updatingId === article.id}
                >
                  <Minus size={14} />
                </button>
                <button 
                  onClick={() => handleQuickAdjust(article, 1)}
                  className="p-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  disabled={updatingId === article.id}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            <span className={`
              inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black ring-1 ring-inset transition-all
              ${updatingId === article.id ? 'opacity-50 blur-[1px]' : ''}
              ${article.bestand === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-slate-900/10 dark:ring-slate-100/10'
                : article.bestand <= article.mindestbestand 
                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-400 ring-rose-900/20' 
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400 ring-emerald-900/20'}
            `}>
              {updatingId === article.id ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              {article.bestand} {article.unit || 'Stück'}
            </span>
          </div>
        </td>
      )}
      {visibleColumns.includes('purchase_price') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-right tabular-nums">
          {editingId === article.id ? (
            <input
              autoFocus
              type="number"
              step="0.01"
              className="w-20 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-right py-1 px-2 text-xs focus:ring-accent font-bold"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handlePriceSave(article.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePriceSave(article.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
            />
          ) : (
            <button 
              onClick={() => startEditing(article)}
              disabled={updatingId === article.id}
              className="text-slate-900 dark:text-slate-100 hover:text-accent font-bold transition-colors"
            >
              {Number(article.purchase_price || 0).toFixed(2)} €
            </button>
          )}
        </td>
      )}
      {visibleColumns.includes('verkaufspreis') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium">
          {Number(article.verkaufspreis).toFixed(2)} €
        </td>
      )}
      {visibleColumns.includes('herstellpreis') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium">
          {Number(article.herstellpreis).toFixed(2)} €
        </td>
      )}
      {visibleColumns.includes('tax_rate') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium">
          {article.tax_rate} %
        </td>
      )}
      {visibleColumns.includes('mindestbestand') && (
        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium">
          {article.mindestbestand}
        </td>
      )}
      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium w-px">
        <div className="flex items-center justify-end gap-2">
          {(role === 'admin' || role === 'editor') && (
            <Link 
              href={`/dashboard/articles/${article.id}`} 
              title="Bearbeiten"
              aria-label="Artikel bearbeiten"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
            >
              <Edit3 size={16} />
            </Link>
          )}
          {role === 'admin' && (
            <button 
              onClick={() => handleDelete(article.id)}
              disabled={deletingId === article.id}
              title="Löschen"
              aria-label="Artikel löschen"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all disabled:opacity-50"
            >
              {deletingId === article.id ? (
                <span className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-rose-600 rounded-full animate-spin inline-block" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
