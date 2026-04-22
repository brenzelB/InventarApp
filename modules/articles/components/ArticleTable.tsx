"use client";

import Link from 'next/link';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import React, { useState, useEffect, useMemo } from 'react';
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
  columnSettings: any[];
  setColumnSettings: (settings: any[]) => void;
}

export function ArticleTable({ articles, onDelete, columnSettings, setColumnSettings }: ArticleTableProps) {
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
    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === 'row' && active.id !== over.id) {
      setLocalArticles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newList = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('article_sort_order', JSON.stringify(newList.map(a => a.id)));
        return newList;
      });
    } else if (activeType === 'column' && active.id !== over.id) {
      const oldIndex = columnSettings.findIndex((c) => c.key === active.id);
      const newIndex = columnSettings.findIndex((c) => c.key === over.id);
      const newSettings = arrayMove(columnSettings, oldIndex, newIndex);
      setColumnSettings(newSettings);
    }
  };

  const handleResize = (key: string, newWidth: number) => {
    const newSettings = columnSettings.map(c => 
      c.key === key ? { ...c, width: newWidth } : c
    );
    setColumnSettings(newSettings);
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 table-fixed border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th scope="col" className="w-8 px-3 py-4 bg-slate-50 dark:bg-slate-900"></th>
              <SortableContext
                items={columnSettings.filter(c => c.visible).map(c => c.key)}
                strategy={verticalListSortingStrategy} // horizontal is implied by arrayMove, verticalListSortingStrategy works for both
              >
                {columnSettings.filter(c => c.visible).map((col) => (
                  <ResizableHeader 
                    key={col.key} 
                    column={col} 
                    onResize={handleResize}
                  />
                ))}
              </SortableContext>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-950">
            <SortableContext
              items={localArticles.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {localArticles.map((article, index) => (
                <SortableRow 
                  key={article.id}
                  article={article}
                  index={index}
                  columnSettings={columnSettings}
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
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}

function SortableRow({ 
  article, 
  index, 
  columnSettings, 
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
  } = useSortable({ 
    id: article.id,
    data: { type: 'row' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as any,
  };

  const renderCell = (colKey: string) => {
    const col = columnSettings.find(c => c.key === colKey);
    const cellStyle = { width: col?.width, minWidth: col?.width };

    switch (colKey) {
      case 'qr_code':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap py-4 px-3 overflow-hidden">
            <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="sm" />
          </td>
        );
      case 'name':
        return (
          <td key={colKey} style={cellStyle} className="px-3 py-4 text-sm font-bold overflow-hidden">
            <Link href={`/dashboard/articles/${article.id}`} className="text-slate-900 dark:text-slate-100 hover:text-accent transition-colors block truncate">
              {article.name}
            </Link>
            {article.group && (
              <span className="inline-flex mt-1 items-center rounded-3xl bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                {article.group.name}
              </span>
            )}
          </td>
        );
      case 'description':
        return (
          <td key={colKey} style={cellStyle} className="px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium overflow-hidden truncate" title={article.description || ''}>
            {article.description || "—"}
          </td>
        );
      case 'sku':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-bold font-mono overflow-hidden">{article.sku}</td>
        );
      case 'lagerort':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium overflow-hidden">{article.lagerort || "—"}</td>
        );
      case 'bestand':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-right overflow-hidden">
            <div className="flex items-center justify-end gap-2 group/stock">
              {role !== 'viewer' && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-0.5 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                  <button onClick={() => handleQuickAdjust(article, -1)} className="p-1 hover:text-red-600 dark:hover:text-red-400 transition-colors" disabled={updatingId === article.id}>
                    <Minus size={14} />
                  </button>
                  <button onClick={() => handleQuickAdjust(article, 1)} className="p-1 hover:text-green-600 dark:hover:text-green-400 transition-colors" disabled={updatingId === article.id}>
                    <Plus size={14} />
                  </button>
                </div>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black ring-1 ring-inset transition-all ${updatingId === article.id ? 'opacity-50 blur-[1px]' : ''} ${article.bestand === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-slate-900/10 dark:ring-slate-100/10' : article.bestand <= article.mindestbestand ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-400 ring-rose-900/20' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-400 ring-emerald-900/20'}`}>
                {updatingId === article.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {article.bestand} {article.unit || 'Stück'}
              </span>
            </div>
          </td>
        );
      case 'purchase_price':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-right tabular-nums overflow-hidden">
            {editingId === article.id ? (
              <input autoFocus type="number" step="0.01" className="w-full rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-right py-1 px-2 text-xs focus:ring-accent font-bold" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handlePriceSave(article.id)} onKeyDown={(e) => { if (e.key === 'Enter') handlePriceSave(article.id); if (e.key === 'Escape') setEditingId(null); }} />
            ) : (
              <button onClick={() => startEditing(article)} disabled={updatingId === article.id} className="text-slate-900 dark:text-slate-100 hover:text-accent font-bold transition-colors">
                {Number(article.purchase_price || 0).toFixed(2)} €
              </button>
            )}
          </td>
        );
      case 'verkaufspreis':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium overflow-hidden">
            {Number(article.verkaufspreis).toFixed(2)} €
          </td>
        );
      case 'herstellpreis':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium overflow-hidden">
            {Number(article.herstellpreis).toFixed(2)} €
          </td>
        );
      case 'tax_rate':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium overflow-hidden">
            {article.tax_rate} %
          </td>
        );
      case 'mindestbestand':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums font-medium overflow-hidden">
            {article.mindestbestand}
          </td>
        );
      case 'actions':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-sm font-medium w-px overflow-hidden">
            <div className="flex items-center justify-end gap-2">
              {(role === 'admin' || role === 'editor') && (
                <Link href={`/dashboard/articles/${article.id}`} title="Bearbeiten" aria-label="Artikel bearbeiten" className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all">
                  <Edit3 size={16} />
                </Link>
              )}
              {role === 'admin' && (
                <button onClick={() => handleDelete(article.id)} disabled={deletingId === article.id} title="Löschen" aria-label="Artikel löschen" className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all disabled:opacity-50">
                  {deletingId === article.id ? <span className="w-4 h-4 border-2 border-slate-200 dark:border-slate-700 border-t-rose-600 rounded-full animate-spin inline-block" /> : <Trash2 size={16} />}
                </button>
              )}
            </div>
          </td>
        );
      default: return null;
    }
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={`
        hover:bg-slate-50 dark:hover:bg-slate-900 transition-all groups
        ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 shadow-2xl ring-2 ring-blue-500/50 z-50 relative' : ''}
      `}
    >
      <td className="px-3 py-4 w-8 bg-white dark:bg-slate-950">
        <button {...attributes} {...listeners} className="p-1 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing hover:text-blue-500 transition-colors">
          <GripVertical size={16} />
        </button>
      </td>
      {columnSettings.filter(c => c.visible).map(col => renderCell(col.key))}
    </tr>
  );
}

function ResizableHeader({ column, onResize }: { column: any; onResize: (key: string, width: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: column.key,
    data: { type: 'column' }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: column.width,
    minWidth: column.width,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.pageX;
    const startWidth = column.width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      onResize(column.key, newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      scope="col"
      className={`
        group relative px-3 py-4 text-left text-[11px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/50 last:border-0 overflow-hidden
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
    >
      <div {...attributes} {...listeners} className="cursor-move select-none truncate">
        {column.label}
      </div>
      
      {column.key !== 'actions' && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-10"
        />
      )}
    </th>
  );
}
