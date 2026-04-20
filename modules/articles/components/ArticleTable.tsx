"use client";

import Link from 'next/link';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import { useState } from 'react';
import { QRCodeView } from "@/components/QRCodeView";
import { Pencil, Trash2 } from 'lucide-react';

interface ArticleTableProps {
  articles: Article[];
  onDelete: () => void;
}

export function ArticleTable({ articles, onDelete }: ArticleTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Artikel wirklich löschen?')) return;
    setDeletingId(id);
    try {
      await articleService.deleteArticle(id);
      onDelete();
    } catch (err: any) {
      alert(err.message || 'Fehler beim Löschen des Artikels.');
    } finally {
      setDeletingId(null);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Keine Artikel gefunden</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lege deinen ersten Artikel an.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-slate-200 dark:ring-slate-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700 table-auto">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 sm:pl-6 w-16">QR</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Beschreibung</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">SKU</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-200">Bestand</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-200">Preis</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 w-px whitespace-nowrap">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6 w-16">
                <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="sm" />
              </td>
              <td className="px-3 py-4 text-sm font-medium">
                <Link href={`/dashboard/articles/${article.id}`} className="text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block truncate max-w-xs md:max-w-md">
                  {article.name}
                </Link>
                {article.group && (
                  <span className="inline-flex mt-1 items-center rounded-md bg-slate-50 dark:bg-slate-900/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                    {article.group.name}
                  </span>
                )}
              </td>
              <td className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={article.description || ''}>
                {article.description || "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{article.sku}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${article.bestand <= article.mindestbestand ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20' : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20'}`}>
                  {article.bestand}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-right tabular-nums">
                {Number(article.verkaufspreis).toFixed(2)} €
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium w-px">
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/dashboard/articles/${article.id}`} 
                    title="Bearbeiten"
                    aria-label="Artikel bearbeiten"
                    className="hover:opacity-70 transition-all p-1"
                  >
                    <Pencil size={18} className="text-blue-500" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(article.id)}
                    disabled={deletingId === article.id}
                    title="Löschen"
                    aria-label="Artikel löschen"
                    className="hover:opacity-70 disabled:opacity-50 transition-all p-1"
                  >
                    {deletingId === article.id ? (
                      <span className="w-5 h-5 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin inline-block" />
                    ) : (
                      <Trash2 size={18} className="text-red-500" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
