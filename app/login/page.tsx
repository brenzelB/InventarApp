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
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          In deinem Account anmelden
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Oder wenn du noch keinen Account hast,{" "}
          <Link href="/register" className="font-bold text-accent hover:opacity-80 transition-opacity">
            hier registrieren
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          {isMockMode && (
            <div className="mb-6 p-4 rounded-3xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800 font-bold">
                ⚠️ Demo-Modus aktiv
              </p>
              <p className="text-xs text-amber-700 mt-1 font-medium">
                Du kannst dich direkt mit dem Demo-Button anmelden oder einen neuen Account erstellen.
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-3xl bg-red-50 p-4 mb-4 border border-red-100">
                <div className="text-sm text-red-700 font-bold">
                  {error}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-bold leading-6 text-slate-700">
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
                  className="block w-full rounded-3xl border-0 py-1.5 text-slate-900 bg-white shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 px-3 disabled:opacity-50 font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold leading-6 text-slate-700">
                  Passwort
                </label>
                <Link href="/forgot-password/login" className="text-xs text-accent hover:opacity-80 font-bold transition-opacity">
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

            <div className="space-y-6">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center rounded-3xl bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  className="flex w-full justify-center items-center rounded-3xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-75"
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
