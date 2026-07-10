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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToHorizontalAxis } from '@dnd-kit/modifiers';

interface ColumnSetting {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

interface ArticleTableProps {
  articles: Article[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
  columnSettings: ColumnSetting[];
  setColumnSettings: (settings: ColumnSetting[]) => void;
  onRowReorder?: (newOrder: string[]) => void;
}

export function ArticleTable({ 
  articles, 
  onDelete, 
  onRefresh,
  columnSettings, 
  setColumnSettings,
  onRowReorder 
}: ArticleTableProps) {
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
        const newIds = newList.map(a => a.id);
        
        localStorage.setItem('article_sort_order', JSON.stringify(newIds));
        if (onRowReorder) onRowReorder(newIds);
        
        return newList;
      });
    } else if (activeType === 'column' && active.id !== over.id) {
      const oldIndex = columnSettings.findIndex((c: ColumnSetting) => c.key === active.id);
      const newIndex = columnSettings.findIndex((c: ColumnSetting) => c.key === over.id);
      const newSettings = arrayMove(columnSettings, oldIndex, newIndex);
      setColumnSettings(newSettings);
    }
  };

  const handleResize = (key: string, newWidth: number) => {
    const newSettings = columnSettings.map((c: ColumnSetting) => 
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
      
      // Update server components state
      router.refresh();
      
      // Trigger local state update in parent
      onDelete(id);
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
      onRefresh(); // Refresh list correctly
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
      onRefresh(); 
    } catch (err: any) {
      toastError("Fehler: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 bg-widget rounded-card border border-outline shadow-sm">
        <svg className="mx-auto h-12 w-12 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-bold font-sora tracking-wide text-foreground uppercase">Keine Artikel gefunden</h3>
        <p className="mt-1 text-xs text-foreground/60 font-medium font-sans">Lege deinen ersten Artikel an.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-outline sm:rounded-card shadow-sm bg-widget">
      <table className="min-w-full divide-y divide-outline table-fixed border-collapse">
        <thead className="bg-surface-2 dark:bg-surface-2/40">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
          >
            <tr>
              <th scope="col" className="w-8 px-3 py-4 bg-transparent border-r border-outline"></th>
              <SortableContext
                items={columnSettings.filter(c => c.visible).map(c => c.key)}
                strategy={horizontalListSortingStrategy}
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
          </DndContext>
        </thead>
        <tbody className="divide-y divide-outline bg-transparent">
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
          </DndContext>
        </tbody>
      </table>
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
}: {
  article: Article;
  index: number;
  columnSettings: ColumnSetting[];
  role: string | null;
  updatingId: string | null;
  deletingId: string | null;
  editingId: string | null;
  editValue: string;
  setEditValue: (val: string) => void;
  handleQuickAdjust: (article: Article, delta: number) => void;
  startEditing: (article: Article) => void;
  handlePriceSave: (id: string) => void;
  setEditingId: (id: string | null) => void;
  handleDelete: (id: string) => void;
}) {
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
    const col = columnSettings.find((c: ColumnSetting) => c.key === colKey);
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
          <td key={colKey} style={cellStyle} className="px-3 py-4 text-xs font-bold font-sora overflow-hidden text-foreground">
            <Link href={`/dashboard/articles/${article.id}`} className="text-foreground hover:text-primary transition-colors block truncate">
              {article.name}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {article.group && (
                <span className="inline-flex items-center rounded-element bg-secondary/15 px-2 py-0.5 text-[9px] font-bold text-secondary uppercase font-mono tracking-wider border border-secondary/20">
                  {article.group.name}
                </span>
              )}
              {article.is_bundle && (
                <span className="inline-flex items-center rounded-element bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary uppercase font-mono tracking-wider border border-primary/20">
                  Bundle
                </span>
              )}
            </div>
          </td>
        );
      case 'description':
        return (
          <td key={colKey} style={cellStyle} className="px-3 py-4 text-xs text-foreground/70 font-sans overflow-hidden truncate" title={article.description || ''}>
            {article.description || "—"}
          </td>
        );
      case 'sku':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/80 font-bold font-mono overflow-hidden">{article.sku}</td>
        );
      case 'lagerort':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/80 font-bold font-mono overflow-hidden uppercase">{article.lagerort || "—"}</td>
        );
      case 'bestand':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-right overflow-hidden">
            <div className="flex items-center justify-end gap-2 group/stock">
              {role !== 'viewer' && !article.is_bundle && (
                <div className="flex items-center bg-surface-2 dark:bg-surface-2/40 border border-outline rounded-element p-0.5 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                  <button onClick={() => handleQuickAdjust(article, -1)} className="p-1 text-foreground/60 hover:text-primary transition-colors" disabled={updatingId === article.id}>
                    <Minus size={14} />
                  </button>
                  <button onClick={() => handleQuickAdjust(article, 1)} className="p-1 text-foreground/60 hover:text-secondary transition-colors" disabled={updatingId === article.id}>
                    <Plus size={14} />
                  </button>
                </div>
              )}
              <span className={`inline-flex items-center rounded-element px-2 py-0.5 text-[10px] font-bold font-mono border uppercase tracking-wider transition-all ${updatingId === article.id ? 'opacity-50 blur-[1px]' : ''} ${article.bestand === 0 ? 'bg-primary/20 text-primary border-primary/30 font-extrabold shadow-[0_0_10px_rgba(224,108,117,0.1)]' : article.bestand <= article.mindestbestand ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
                {updatingId === article.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                {article.bestand} {article.unit || 'Stück'}
              </span>
            </div>
          </td>
        );
      case 'purchase_price':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-right tabular-nums overflow-hidden">
            {editingId === article.id ? (
              <input autoFocus type="number" step="any" className="w-full rounded-element border border-outline bg-surface-0 text-foreground text-right py-1 px-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono font-bold" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handlePriceSave(article.id)} onKeyDown={(e) => { if (e.key === 'Enter') handlePriceSave(article.id); if (e.key === 'Escape') setEditingId(null); }} />
            ) : (
              <button onClick={() => startEditing(article)} disabled={updatingId === article.id} className="text-foreground hover:text-primary font-bold font-mono transition-colors">
                {Number(article.purchase_price || 0).toFixed(2)} €
              </button>
            )}
          </td>
        );
      case 'verkaufspreis':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/70 text-right tabular-nums font-bold font-mono overflow-hidden">
            {Number(article.verkaufspreis).toFixed(2)} €
          </td>
        );
      case 'herstellpreis':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/70 text-right tabular-nums font-bold font-mono overflow-hidden">
            {Number(article.herstellpreis).toFixed(2)} €
          </td>
        );
      case 'tax_rate':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/70 text-right tabular-nums font-bold font-mono overflow-hidden">
            {article.tax_rate} %
          </td>
        );
      case 'mindestbestand':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs text-foreground/70 text-right tabular-nums font-bold font-mono overflow-hidden">
            {article.mindestbestand}
          </td>
        );
      case 'actions':
        return (
          <td key={colKey} style={cellStyle} className="whitespace-nowrap px-3 py-4 text-xs font-medium w-px overflow-hidden">
            <div className="flex items-center justify-end gap-2">
              {(role === 'admin' || role === 'editor') && (
                <Link href={`/dashboard/articles/${article.id}`} title="Bearbeiten" aria-label="Artikel bearbeiten" className="p-2 text-foreground/40 hover:text-secondary hover:bg-surface-2 rounded-element border border-transparent hover:border-outline transition-all">
                  <Edit3 size={16} />
                </Link>
              )}
              {role === 'admin' && (
                <button onClick={() => handleDelete(article.id)} disabled={deletingId === article.id} title="Löschen" aria-label="Artikel löschen" className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-element border border-transparent hover:border-primary/20 transition-all disabled:opacity-50">
                  {deletingId === article.id ? <span className="w-4 h-4 border-2 border-outline border-t-primary rounded-full animate-spin inline-block" /> : <Trash2 size={16} />}
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
        hover:bg-surface-2/40 transition-all border-b border-outline last:border-0
        ${isDragging ? 'bg-primary/10 shadow-lg border border-primary/20 z-50 relative' : ''}
      `}
    >
      <td className="px-3 py-4 w-8 bg-transparent border-r border-outline">
        <button {...attributes} {...listeners} className="p-1 text-foreground/30 cursor-grab active:cursor-grabbing hover:text-primary transition-colors">
          <GripVertical size={16} />
        </button>
      </td>
      {columnSettings.filter(c => c.visible).map(col => renderCell(col.key))}
    </tr>
  );
}

function ResizableHeader({ 
  column, 
  onResize 
}: { 
  column: ColumnSetting; 
  onResize: (key: string, width: number) => void 
}) {
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
        group relative px-3 py-4 text-left text-[10px] font-bold font-mono text-foreground/70 uppercase tracking-widest bg-transparent border-r border-outline last:border-0 overflow-hidden
        ${isDragging ? 'opacity-50 z-50' : ''}
      `}
    >
      <div {...attributes} {...listeners} className="cursor-move select-none truncate">
        {column.label}
      </div>
      
      {column.key !== 'actions' && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/55 transition-colors z-10"
        />
      )}
    </th>
  );
}
