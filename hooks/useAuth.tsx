"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isMockMode } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (newPassword: string) => Promise<{ error: string | null }>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (metadata: any) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hilfsfunktion für Mock-User
const getMockUser = (email: string): User => ({
  id: "mock-user-id",
  email: email,
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      if (isMockMode) {
        const savedUser = localStorage.getItem("mock_user_email");
        if (savedUser) {
          setUser(getMockUser(savedUser));
        }
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    if (!isMockMode) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    if (isMockMode) {
      // Im Mock-Modus akzeptieren wir alles, außer die E-Mail wurde noch nie "registriert"
      const users = JSON.parse(localStorage.getItem("mock_users") || "{}");
      if (users[email] && users[email] === password) {
        localStorage.setItem("mock_user_email", email);
        setUser(getMockUser(email));
        setLoading(false);
        router.push("/dashboard");
        return { error: null };
      }
      setLoading(false);
      return { error: "Ungültige Login-Daten (Mock-Modus: Bitte erst registrieren)" };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);
    
    if (error) {
      return { error: error.message };
    }
    
    router.push("/dashboard");
    return { error: null };
  };

  const register = async (email: string, password: string) => {
    setLoading(true);

    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem("mock_users") || "{}");
      users[email] = password;
      localStorage.setItem("mock_users", JSON.stringify(users));
      localStorage.setItem("mock_user_email", email);
      setUser(getMockUser(email));
      setLoading(false);
      router.push("/dashboard");
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      return { error: error.message };
    }

    router.push("/dashboard");
    return { error: null };
  };

  const loginAsGuest = async () => {
    const guestEmail = "demo@example.com";
    if (isMockMode) {
      localStorage.setItem("mock_user_email", guestEmail);
      setUser(getMockUser(guestEmail));
      router.push("/dashboard");
    }
  };

  const forgotPassword = async (email: string) => {
    if (isMockMode) {
      return { error: "Passwort-Reset ist im Demo-Modus nicht verfügbar. Bitte echtes Supabase-Backend konfigurieren." };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const resetPassword = async (newPassword: string) => {
    if (isMockMode) {
      return { error: "Passwort-Reset ist im Demo-Modus nicht verfügbar." };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    // Alle anderen Sessions invalidieren
    await supabase.auth.signOut({ scope: "others" });
    return { error: null };
  };

  const logout = async () => {
    setLoading(true);
    if (isMockMode) {
      localStorage.removeItem("mock_user_email");
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
    setLoading(false);
    router.push("/login");
  };

  const updateProfile = async (metadata: any) => {
    if (isMockMode) {
      const email = localStorage.getItem("mock_user_email");
      if (email) {
        const mockUser = getMockUser(email);
        mockUser.user_metadata = { ...mockUser.user_metadata, ...metadata };
        setUser(mockUser);
        // Mock profile in localStorage
        const profiles = JSON.parse(localStorage.getItem("mock_profiles") || "{}");
        profiles[email] = mockUser.user_metadata;
        localStorage.setItem("mock_profiles", JSON.stringify(profiles));
      }
      return { error: null };
    }

    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, forgotPassword, resetPassword, loginAsGuest, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
