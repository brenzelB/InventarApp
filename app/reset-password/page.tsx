"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { PasswordInput, getPasswordStrength } from "@/components/PasswordInput";
import { useToast } from "@/hooks/useToast";
import { User } from "lucide-react";

type PageState = "loading" | "ready" | "success" | "error";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supabase setzt automatisch eine Session wenn der Recovery-Token oder Invite-Link gültig ist
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ResetPassword] Auth event:", event, !!session);
      if (event === "PASSWORD_RECOVERY" || session) {
        setPageState("ready");
      }
    });

    // Fallback: Falls Session schon gesetzt (Page-Reload oder Invite-Link)
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
    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      setError("Bitte gib deinen vollständigen Namen (Vor- und Nachnamen) an.");
      return;
    }
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { display_name: fullName }
        });
        
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email?.toLowerCase(),
          display_name: fullName,
          full_name: fullName
        });
      }
    } catch (profileErr) {
      console.error("Profil-Update fehlgeschlagen:", profileErr);
    }

    const result = await resetPassword(password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      toastError("Fehler beim Speichern: " + result.error);
    } else {
      toastSuccess("Passwort erfolgreich gesetzt! Du kannst dich jetzt jederzeit einloggen.");
      setPageState("success");
      // Automatischer Login nach 2 Sekunden
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  const strength = getPasswordStrength(password);

  // ── Loading ──
  if (pageState === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs text-foreground/50 font-bold font-mono uppercase tracking-widest">Token wird geprüft…</p>
      </div>
    );
  }

  // ── Ungültiger Token ──
  if (pageState === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-element bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-sora tracking-wide text-foreground uppercase">Link ungültig oder abgelaufen</h2>
          <p className="mt-2 text-xs text-foreground/60">
            Der Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen an.
          </p>
          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-flex items-center rounded-element bg-primary hover:bg-primary-hover border border-outline px-4 py-2.5 text-xs font-bold text-white dark:text-black dark:font-extrabold shadow-sm transition-colors font-mono uppercase tracking-widest"
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-element bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-sora tracking-wide text-foreground uppercase">Passwort geändert!</h2>
          <p className="mt-2 text-xs text-foreground/60 font-sans">
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
        <div className="text-center text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
          [ SYS_AUTH_SETUP ]
        </div>
        <h2 className="text-center text-3xl font-bold font-sora tracking-tight text-foreground uppercase">
          Passwort festlegen
        </h2>
        <p className="mt-2 text-center text-xs text-foreground/60 font-sans">
          Wähle ein sicheres Passwort für deinen Account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-widget py-8 px-4 border border-outline sm:rounded-card sm:px-10 shadow-[0_0_15px_rgba(224,108,117,0.02)] transition-colors duration-300 bg-grid-pattern bg-opacity-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-element bg-primary/10 p-4 border border-primary/20">
                <p className="text-xs text-primary font-bold font-mono uppercase tracking-wider">{error}</p>
              </div>
            )}

            <div>
               <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1.5 ml-1">Vollständiger Name (Vor- & Nachname)</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <User className="h-4 w-4 text-foreground/40" />
                 </div>
                 <input
                   type="text"
                   required
                   value={fullName}
                   onChange={(e) => setFullName(e.target.value)}
                   placeholder="Max Mustermann"
                   disabled={submitting}
                   className="block w-full pl-10 pr-3 py-2 border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 focus:ring-1 focus:ring-primary focus:border-primary sm:text-xs transition-all shadow-sm font-mono font-bold"
                 />
               </div>
             </div>

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

            <div className="text-[10px] font-mono text-foreground/50 space-y-1 -mt-2 font-bold uppercase tracking-wide pl-1">
              <p className={password.length >= 8 ? "text-emerald-500" : ""}>
                {password.length >= 8 ? "✓" : "○"} Mindestens 8 Zeichen
              </p>
              <p className={/[0-9]/.test(password) ? "text-emerald-500" : ""}>
                {/[0-9]/.test(password) ? "✓" : "○"} Mindestens eine Zahl
              </p>
              <p className={/[A-Z]/.test(password) ? "text-emerald-500" : ""}>
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
              <p className={`text-[10px] -mt-4 font-mono font-bold uppercase tracking-wider pl-1 ${password === confirmPassword ? "text-emerald-500" : "text-primary"}`}>
                {password === confirmPassword ? "✓ Passwörter stimmen überein" : "✗ Passwörter stimmen nicht überein"}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || strength.score < 2}
              className="flex w-full justify-center items-center rounded-element bg-primary hover:bg-primary-hover border border-outline px-3 py-3 text-xs font-bold text-white dark:text-black dark:font-extrabold shadow-sm transition-colors disabled:opacity-75 disabled:cursor-not-allowed font-mono uppercase tracking-widest"
            >
              {submitting ? (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
