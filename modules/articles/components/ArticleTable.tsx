"use client";

import Link from 'next/link';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import { useState } from 'react';
import { QRCodeView } from "@/components/QRCodeView";

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
      <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-200 sm:pl-6">QR</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">SKU</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Bestand</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">Verkaufspreis</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                <QRCodeView svgString={article.qr_code} name={article.name} articleId={article.id} size="sm" />
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                <Link href={`/dashboard/articles/${article.id}`} className="text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {article.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">{article.sku}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${article.bestand <= article.mindestbestand ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20' : 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20'}`}>
                  {article.bestand}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 dark:text-slate-400">{Number(article.verkaufspreis).toFixed(2)} €</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link href={`/dashboard/articles/${article.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4 transition-colors">
                  Bearbeiten
                </Link>
                <button 
                  onClick={() => handleDelete(article.id)}
                  disabled={deletingId === article.id}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                >
                  {deletingId === article.id ? 'Lösche...' : 'Löschen'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
