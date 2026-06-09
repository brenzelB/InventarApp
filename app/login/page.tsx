"use client";

import { useState, SyntheticEvent, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isMockMode } from "@/lib/supabaseClient";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const { login, loginAsGuest, loading, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError("");
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    await loginAsGuest();
  };

  if (user) return null;

  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
          [ SYS_AUTH_LOGIN ]
        </div>
        <h2 className="text-center text-3xl font-bold font-sora tracking-tight text-foreground uppercase">
          Anmelden
        </h2>
        <p className="mt-2 text-center text-xs text-foreground/60 font-sans">
          Oder wenn du noch keinen Account hast,{" "}
          <Link href="/register" className="font-bold text-primary hover:underline transition-all">
            hier registrieren
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-widget py-8 px-4 border border-outline sm:rounded-card sm:px-10 shadow-[0_0_15px_rgba(224,108,117,0.02)] transition-colors duration-300 bg-grid-pattern bg-opacity-5">
          {isMockMode && (
            <div className="mb-6 p-4 rounded-element bg-secondary/10 border border-secondary/20">
              <p className="text-xs text-secondary font-bold font-mono uppercase tracking-wider">
                ⚠️ Demo-Modus aktiv
              </p>
              <p className="text-xs text-foreground/80 mt-1 font-sans">
                Du kannst dich direkt mit dem Demo-Button anmelden oder einen neuen Account erstellen.
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-element bg-primary/10 p-4 mb-4 border border-primary/20">
                <div className="text-xs text-primary font-bold font-mono uppercase tracking-wider">
                  {error}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1.5 ml-1">
                E-Mail Adresse
              </label>
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="block w-full rounded-element border border-outline py-2 px-3 text-foreground bg-surface-0 shadow-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-foreground/40 sm:text-xs disabled:opacity-50 font-mono font-bold transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1.5 ml-1">
                  Passwort
                </label>
                <Link href="/forgot-password" className="text-[10px] text-primary hover:underline font-bold font-mono uppercase tracking-wider">
                  Passwort vergessen?
                </Link>
              </div>
              <div className="mt-2">
                <PasswordInput
                  id="password"
                  name="password"
                  label=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center rounded-element bg-primary hover:bg-primary-hover border border-outline px-3 py-3 text-xs font-bold text-white dark:text-black dark:font-extrabold shadow-sm transition-colors disabled:opacity-75 disabled:cursor-not-allowed font-mono uppercase tracking-widest"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Anmelden"}
              </button>

              {isMockMode && (
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="flex w-full justify-center items-center rounded-element bg-surface-2 hover:bg-foreground/5 border border-outline px-3 py-3 text-xs font-bold text-foreground/80 shadow-sm transition-colors disabled:opacity-75 font-mono uppercase tracking-widest"
                >
                  Demo Login (Ohne Backend)
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
