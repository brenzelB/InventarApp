export default function DashboardPage() {
  return (
    <div className="py-6">
      <div className="md:flex md:items-center md:justify-between px-4 sm:px-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
      </div>
      
      <div className="mt-8 overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="px-4 py-5 sm:p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Keine Daten vorhanden</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dies ist ein geschützter Platzhalter-Bereich. Verbinde Supabase, um Daten zu laden.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              Neuen Eintrag erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
