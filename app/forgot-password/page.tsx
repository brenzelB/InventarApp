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
        <div className="text-center text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
          [ SYS_AUTH_RESET ]
        </div>
        <h2 className="text-center text-3xl font-bold font-sora tracking-tight text-foreground uppercase">
          Passwort Reset
        </h2>
        <p className="mt-2 text-center text-xs text-foreground/60 font-sans">
          Zurück zur{" "}
          <Link href="/login" className="font-bold text-primary hover:underline transition-all">
            Anmeldung
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-widget py-8 px-4 border border-outline sm:rounded-card sm:px-10 shadow-[0_0_15px_rgba(224,108,117,0.02)] transition-colors duration-300 bg-grid-pattern bg-opacity-5">

          {isMockMode && (
            <div className="mb-6 p-4 rounded-element bg-secondary/10 border border-secondary/20">
              <p className="text-xs text-secondary font-bold font-mono uppercase tracking-wider">⚠️ Demo-Modus aktiv</p>
              <p className="text-xs text-foreground/80 mt-1 font-sans">
                Passwort-Reset ist im Demo-Modus nicht verfügbar. Bitte echtes Supabase-Backend konfigurieren.
              </p>
            </div>
          )}

          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-element bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-bold font-sora uppercase tracking-wider text-foreground">E-Mail versendet</h3>
              <p className="mt-2 text-xs text-foreground/60 font-sans leading-relaxed">
                Falls ein Account mit der Adresse <strong>{email}</strong> existiert, wurde ein Reset-Link versendet.
                Bitte prüfe auch deinen Spam-Ordner.
              </p>
              <p className="mt-2 text-[10px] font-bold font-mono text-foreground/40 uppercase tracking-widest">
                Gültig für 24 Stunden
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-element bg-primary hover:bg-primary-hover border border-outline px-4 py-2.5 text-xs font-bold text-white dark:text-black dark:font-extrabold shadow-sm transition-colors font-mono uppercase tracking-widest"
                >
                  Zurück zur Anmeldung
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-element bg-primary/10 p-4 border border-primary/20">
                  <p className="text-xs text-primary font-bold font-mono uppercase tracking-wider">{error}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-foreground/75 font-sans leading-relaxed mb-4">
                  Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
                </p>
                <label htmlFor="email" className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1.5 ml-1">
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
                    className="block w-full rounded-element border border-outline py-2.5 px-3 text-foreground bg-surface-0 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-foreground/40 sm:text-xs disabled:opacity-50 font-mono font-bold transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isMockMode}
                className="flex w-full justify-center items-center rounded-element bg-primary hover:bg-primary-hover border border-outline px-3 py-3 text-xs font-bold text-white dark:text-black dark:font-extrabold shadow-sm transition-colors disabled:opacity-75 disabled:cursor-not-allowed font-mono uppercase tracking-widest"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
