"use client";

import Link from "next/link";
import { ArticleTable } from "@/modules/articles/components/ArticleTable";
import { useArticles } from "@/modules/articles/hooks/useArticles";

export default function ArticlesPage() {
  const { articles, loading, error, refetch } = useArticles();

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Artikelverwaltung
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Übersicht aller angelegten Artikel.</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href="/dashboard/articles/new" className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
            Neuer Artikel
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <ArticleTable articles={articles} onDelete={refetch} />
      )}
    </div>
  );
}
