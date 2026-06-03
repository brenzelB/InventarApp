import { ArticleForm } from "@/modules/articles/components/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
          [ INVENTORY_CREATE ]
        </div>
        <h2 className="text-2xl font-bold font-sora tracking-tight leading-7 text-foreground sm:truncate sm:text-3xl uppercase">
          Neuer Artikel
        </h2>
        <p className="mt-1 text-xs text-foreground/60 font-sans">Lege einen neuen Artikel im System an.</p>
      </div>
      
      <ArticleForm />
    </div>
  );
}
