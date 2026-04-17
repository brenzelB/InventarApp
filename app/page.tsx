import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
        Willkommen zur <span className="text-indigo-600 dark:text-indigo-400">Inventar App</span>
      </h1>
      <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-8">
        Dies ist eine minimalistische und moderne Basisstruktur für dein Projekt mit Next.js, Tailwind CSS und Supabase.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
          Zum Dashboard
        </Link>
        <Link href="/login" className="rounded-lg bg-white dark:bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
          Anmelden
        </Link>
      </div>
    </div>
  );
}
