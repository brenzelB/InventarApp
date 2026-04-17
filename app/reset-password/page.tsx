"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { PasswordInput, getPasswordStrength } from "@/components/PasswordInput";

type PageState = "loading" | "ready" | "success" | "error";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supabase setzt automatisch eine Session wenn der Recovery-Token gültig ist
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    // Fallback: Falls Session schon gesetzt (Page-Reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("ready");
      } else {
        // Kurzes Warten, ob der Recovery-Event noch kommt
        const timer = setTimeout(() => {
          setPageState((prev) => (prev === "loading" ? "error" : prev));
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (): string | null => {
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
    if (!/[0-9]/.test(password)) return "Das Passwort muss mindestens eine Zahl enthalten.";
    if (!/[A-Z]/.test(password)) return "Das Passwort muss mindestens einen Großbuchstaben enthalten.";
    if (password !== confirmPassword) return "Die Passwörter stimmen nicht überein.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await resetPassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setPageState("success");
      // Automatischer Login nach 2 Sekunden
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  const strength = getPasswordStrength(password);

  // ── Loading ──
  if (pageState === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-slate-500 dark:text-slate-400">Token wird geprüft…</p>
      </div>
    );
  }

  // ── Ungültiger Token ──
  if (pageState === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Link ungültig oder abgelaufen</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Der Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen an.
          </p>
          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Neuen Link anfordern
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Erfolg ──
  if (pageState === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Passwort erfolgreich geändert!</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Du wirst automatisch zum Dashboard weitergeleitet…
          </p>
        </div>
      </div>
    );
  }

  // ── Formular ──
  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Neues Passwort setzen
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <PasswordInput
              id="new-password"
              name="new-password"
              label="Neues Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={submitting}
              showStrength
            />

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 -mt-2">
              <p className={password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
                {password.length >= 8 ? "✓" : "○"} Mindestens 8 Zeichen
              </p>
              <p className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                {/[0-9]/.test(password) ? "✓" : "○"} Mindestens eine Zahl
              </p>
              <p className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                {/[A-Z]/.test(password) ? "✓" : "○"} Mindestens ein Großbuchstabe
              </p>
            </div>

            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              label="Passwort bestätigen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={submitting}
            />

            {confirmPassword && (
              <p className={`text-xs -mt-4 ${password === confirmPassword ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {password === confirmPassword ? "✓ Passwörter stimmen überein" : "✗ Passwörter stimmen nicht überein"}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || strength.score < 2}
              className="flex w-full justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : "Passwort speichern"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
