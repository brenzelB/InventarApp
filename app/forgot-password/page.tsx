"use client";

import { useState, SyntheticEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { isMockMode } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Passwort zurücksetzen
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Zurück zur{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Anmeldung
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-700">

          {isMockMode && (
            <div className="mb-6 p-4 rounded-md bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">⚠️ Demo-Modus aktiv</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Passwort-Reset ist im Demo-Modus nicht verfügbar. Bitte echtes Supabase-Backend konfigurieren.
              </p>
            </div>
          )}

          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">E-Mail versendet</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Falls ein Account mit der Adresse <strong>{email}</strong> existiert, wurde ein Reset-Link versendet.
                Bitte prüfe auch deinen Spam-Ordner.
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Der Link ist für 24 Stunden gültig.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
                </p>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">
                  E-Mail Adresse
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isMockMode}
                className="flex w-full justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : "Reset-Link senden"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
