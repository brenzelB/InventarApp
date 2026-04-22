"use client";

import Link from 'next/link';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import { QRCodeView } from "@/components/QRCodeView";
import { Edit3, Trash2, Plus, Minus, Loader2 } from 'lucide-react';

interface ArticleTableProps {
  articles: Article[];
  onDelete: () => void;
}

export function ArticleTable({ articles, onDelete }: ArticleTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { role } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

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
      <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-bold text-slate-900">Keine Artikel gefunden</h3>
        <p className="mt-1 text-sm text-slate-500 font-medium">Lege deinen ersten Artikel an.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-slate-200 sm:rounded-2xl">
      <table className="min-w-full divide-y divide-slate-200 table-auto">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="py-4 pl-4 pr-3 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest sm:pl-6 w-16">QR</th>
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest">Name</th>
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest">Beschreibung</th>
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest">SKU</th>
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest">Lagerort</th>
            <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest">Bestand</th>
            <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest">EK-Preis</th>
            <th scope="col" className="px-3 py-4 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest">VK-Preis</th>
            <th scope="col" className="px-3 py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest w-px whitespace-nowrap">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {articles.map((article, index) => (
            <tr 
              key={article.id} 
              className={`
                hover:bg-slate-50 transition-all groups
                animate-in fade-in slide-in-from-left-4 duration-500
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6 w-16">
                <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="sm" />
              </td>
              <td className="px-3 py-4 text-sm font-bold">
                <Link href={`/dashboard/articles/${article.id}`} className="text-slate-900 hover:text-accent transition-colors block truncate max-w-xs md:max-w-md">
                  {article.name}
                </Link>
                {article.group && (
                  <span className="inline-flex mt-1 items-center rounded-3xl bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 ring-1 ring-inset ring-slate-200">
                    {article.group.name}
                  </span>
                )}
              </td>
              <td className="px-3 py-4 text-sm text-slate-600 font-medium max-w-xs truncate" title={article.description || ''}>
                {article.description || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 font-bold font-mono">{article.sku}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 font-medium">{article.lagerort || "—"}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                <div className="flex items-center justify-end gap-2 group/stock">
                  {role !== 'viewer' && (
                    <div className="flex items-center bg-slate-100 rounded-2xl p-0.5 opacity-0 group-hover/stock:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleQuickAdjust(article, -1)}
                        className="p-1 hover:text-red-600 transition-colors"
                        disabled={updatingId === article.id}
                      >
                        <Minus size={14} />
                      </button>
                      <button 
                        onClick={() => handleQuickAdjust(article, 1)}
                        className="p-1 hover:text-green-600 transition-colors"
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
                      ? 'bg-slate-100 text-slate-900 ring-slate-900/10'
                      : article.bestand <= article.mindestbestand 
                      ? 'bg-rose-100 text-rose-900 ring-rose-900/20' 
                      : 'bg-emerald-100 text-emerald-900 ring-emerald-900/20'}
                  `}>
                    {updatingId === article.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    {article.bestand} {article.unit || 'Stück'}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right tabular-nums">
                {editingId === article.id ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    className="w-20 rounded border-slate-300 bg-white text-right py-1 px-2 text-xs focus:ring-accent font-bold"
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
                    className="hover:text-accent font-bold transition-colors"
                  >
                    {Number(article.purchase_price || 0).toFixed(2)} €
                  </button>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right tabular-nums font-medium">
                {Number(article.verkaufspreis).toFixed(2)} €
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium w-px">
                <div className="flex items-center justify-end gap-2">
                  {(role === 'admin' || role === 'editor') && (
                    <Link 
                      href={`/dashboard/articles/${article.id}`} 
                      title="Bearbeiten"
                      aria-label="Artikel bearbeiten"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
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
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      {deletingId === article.id ? (
                        <span className="w-4 h-4 border-2 border-slate-200 border-t-rose-600 rounded-full animate-spin inline-block" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
