import { ArticleForm } from "@/modules/articles/components/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          Neuer Artikel
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lege einen neuen Artikel im System an.</p>
      </div>
      
      <ArticleForm />
    </div>
  );
}
