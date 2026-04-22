"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { inviteTeamMember, deleteTeamMember, updateTeamMemberRole } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { 
  Users, 
  User,
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  RefreshCcw
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  metadata?: {
    name?: string;
  };
}

export default function TeamPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [inviteEmailError, setInviteEmailError] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[Team] Fetching members and invitations...");
      
      // Separate queries to avoid one failing the other
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*');
      
      const { data: iData, error: iError } = await supabase
        .from('invitations')
        .select('*');

      if (pError) console.error("[Team] Profiles fetch error:", pError.message);
      if (iError) console.error("[Team] Invitations fetch error:", iError.message);

      if (pData) {
        // Safe sorting locally if created_at exists
        const sorted = [...pData].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return 0;
        });
        setProfiles(sorted);
      }
      
      if (iData) setInvitations(iData);
    } catch (err: any) {
      console.error("[Team] Fetch failed:", err.message);
      setMessage({ text: "Teilweiser Fehler beim Laden der Daten.", type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchTeamData();
    }
  }, [role, authLoading, fetchTeamData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("HANDLE_INVITE_START", { email: inviteEmail, name: inviteName });
    
    // Client-Side Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteEmailError(true);
      toastError("Bitte gib eine gültige E-Mail Adresse ein.");
      return;
    }
    setInviteEmailError(false);

    if (!inviteName.trim()) {
      toastError("Bitte gib einen Namen für den Nutzer ein.");
      return;
    }
    
    setIsInviting(true);
    setMessage(null);

    try {
      console.log("[Team] Starting invitation process...");
      
      // Timeout Logic
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Supabase Timeout")), 10000)
      );

      const result = await Promise.race([
        inviteTeamMember(
          inviteEmail.trim().toLowerCase(),
          inviteRole,
          user?.id || "",
          { name: inviteName.trim() }
        ),
        timeoutPromise
      ]) as any;

      if (!result.success) {
        if (result.status === 429 || result.error?.includes('429') || result.error?.toLowerCase().includes('rate limit')) {
          toastError("Supabase-Limit erreicht (max. 3/Std). Bitte später versuchen.");
          throw new Error("Rate-Limit erreicht.");
        }
        
        // Show more detailed error if available
        const detail = result.raw ? ` (${JSON.stringify(result.raw)})` : "";
        toastError(`Einladung fehlgeschlagen: ${result.error}${detail}`);
        throw new Error(result.error || "Unbekannter Fehler");
      }

      toastSuccess(`Einladung an ${inviteEmail} wurde erfolgreich gesendet!`);
      setInviteEmail("");
      setInviteName("");
      fetchTeamData();
    } catch (err: any) {
      console.error("[Team] Invitation failed:", err);
      // Already toasted in !result.success if it came from the server
      if (!err.message.includes("Rate-Limit")) {
        toastError("Fehler: " + (err.message || "Unbekannter Fehler"));
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteMember = async (id: string, email: string) => {
    if (id === user?.id) {
       toastError("Du kannst dich nicht selbst löschen.");
       return;
    }
    if (!confirm(`Mitglied ${email} wirklich entfernen?`)) return;

    try {
      const result = await deleteTeamMember(id);
      if (!result.success) throw new Error(result.error);
      
      toastSuccess("Mitglied erfolgreich entfernt.");
      router.refresh();
      fetchTeamData();
    } catch (err: any) {
      console.error("[Team] Member deletion failed:", err);
      toastError("Löschen fehlgeschlagen: " + err.message);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
      fetchTeamData();
    } catch (err: any) {
      alert("Löschen fehlgeschlagen: " + err.message);
    }
  };

  const handleUpdateRole = async (id: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const result = await updateTeamMemberRole(id, newRole);
      if (!result.success) throw new Error(result.error);
      
      toastSuccess(`Rolle erfolgreich zu ${newRole.toUpperCase()} geändert.`);
      fetchTeamData();
    } catch (err: any) {
      console.error("[Team] Role update failed:", err);
      toastError("Rollen-Update fehlgeschlagen: " + err.message);
    }
  };

  // 1. Loading state for Auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // 2. Deny access if not admin (including email joker)
  const isAdmin = role === 'admin' || user?.email === 'brenzel.ai@gmail.com';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-3xl flex items-center justify-center mb-8 ring-8 ring-red-50 dark:ring-red-900/10">
           <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Zugriff verweigert</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-md font-bold">
          Diese Seite ist ausschließlich Administratoren vorbehalten. Deine aktuelle Rolle ist: <span className="text-red-600 dark:text-red-400 font-black uppercase">{role}</span>.
        </p>
        <div className="mt-8 flex gap-8">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-3xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <RefreshCcw className="w-4 h-4" /> Aktualisieren
          </button>
          <a href="/dashboard" className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-3xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Zum Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-4xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:truncate sm:tracking-tight uppercase tracking-tighter">
            Team-Verwaltung
          </h2>
          <p className="mt-4 text-base font-bold text-slate-500 dark:text-slate-400">
            Zentrale Schnittstelle für Mitglieder, Berechtigungen und Einladungen.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-8">
          <button 
            onClick={fetchTeamData}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ring-1 ring-slate-100/50 dark:ring-slate-800/50"
            title="Daten aktualisieren"
          >
            <RefreshCcw className={`w-5 h-5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Mitglieder-Tabelle */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none overflow-hidden transition-all ring-1 ring-slate-100/30 dark:ring-slate-800/30">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/50">
              <div className="flex items-center gap-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Teammitglieder</h3>
              </div>
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-accent dark:text-indigo-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-accent/10">{profiles.length} Aktiv</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-8 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">Mitglied</th>
                    <th className="px-8 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">E-Mail</th>
                    <th className="px-8 py-4 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">Rolle</th>
                    <th className="px-8 py-4 text-right text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em]">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-950">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900 transition-all cursor-default">
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-slate-900 dark:text-slate-100">
                        {profile.display_name || 'Unbekannt'}
                        {profile.id === user?.id && <span className="ml-2 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-accent dark:text-indigo-300 px-2 py-0.5 rounded-3xl font-black uppercase tracking-widest">ICH</span>}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-bold">
                        {profile.email}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <select
                          disabled={profile.id === user?.id}
                          value={profile.role}
                          onChange={(e) => handleUpdateRole(profile.id, e.target.value as any)}
                          className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 focus:ring-0 cursor-pointer disabled:opacity-40 hover:text-accent transition-colors"
                        >
                          <option value="admin" className="dark:bg-slate-900">Admin</option>
                          <option value="editor" className="dark:bg-slate-900">Editor</option>
                          <option value="viewer" className="dark:bg-slate-900">Viewer</option>
                        </select>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteMember(profile.id, profile.email)}
                          disabled={profile.id === user?.id}
                          className="text-slate-400 hover:text-red-600 transition-all p-2 rounded-3xl hover:bg-red-50 disabled:hidden"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loading && profiles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
                        <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Lade Teammitglieder...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Einladungen-Sektion */}
          {invitations.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-md dark:shadow-none ring-1 ring-slate-100/50 dark:ring-slate-800/50 overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center gap-8 bg-slate-50/20 dark:bg-slate-900/50">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Ausstehende Einladungen</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-950">
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100">{invite.email}</span>
                            {invite.metadata?.name && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-0.5">{invite.metadata.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest text-right">
                          {invite.role}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right w-px">
                          <button
                            onClick={() => handleDeleteInvitation(invite.id)}
                            className="text-slate-400 hover:text-red-500 transition-all p-2 rounded-3xl hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Einladungs-Tool */}
        <div className="space-y-8">
          <div className="bg-accent dark:bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl dark:shadow-none border border-transparent dark:border-slate-800 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <UserPlus className="w-48 h-48 rotate-12" />
            </div>
            <h3 className="text-2xl font-black mb-8 relative z-10 uppercase tracking-tighter dark:text-white">
              Nutzer einladen
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80 pl-1 dark:text-slate-400">Name des Nutzers</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 w-5 h-5 text-indigo-200 dark:text-slate-500" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full bg-white/10 dark:bg-slate-950/50 border border-white/20 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-200 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-accent/50 text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80 pl-1 dark:text-slate-400">E-Mail Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-indigo-200 dark:text-slate-500" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteEmailError) setInviteEmailError(false);
                    }}
                    placeholder="name@firma.de"
                    className={`w-full bg-white/10 dark:bg-slate-950/50 border ${inviteEmailError ? 'border-red-500 ring-2 ring-red-500/50' : 'border-white/20 dark:border-slate-800'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-indigo-200 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-accent/50 text-sm font-bold transition-all`}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80 pl-1 dark:text-slate-400">Zukünftige Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-white/10 dark:bg-slate-950/50 border border-white/20 dark:border-slate-800 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-accent/50 text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                >
                  <option value="viewer" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">Viewer (Lesen)</option>
                  <option value="editor" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900">Editor (Schreiben)</option>
                  <option value="admin" className="text-slate-900 dark:text-slate-100 dark:bg-slate-900 font-black">Admin (Vollzugriff)</option>
                </select>
              </div>

              {message && (
                <div className={`p-5 rounded-2xl flex items-center gap-8 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-white/20 text-white' : 'bg-red-500/50 text-white border border-red-400'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-white dark:bg-slate-800 text-accent dark:text-white rounded-2xl py-5 text-xs font-black uppercase tracking-[0.3em] shadow-xl dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-8 group"
              >
                {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                Einladung senden
              </button>
            </form>
          </div>

          {/* Rollen-Info-Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-700 ring-1 ring-slate-100/50 dark:ring-slate-800/50 space-y-8">
            <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] pl-1">Berechtigungen</h4>
            <div className="space-y-6">
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="font-black text-[11px] text-slate-900 dark:text-slate-100 uppercase tracking-widest block mb-1">Admins</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                    Volle Team-Verwaltung, Artikel-Manipulation und Systemzugriff.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="font-black text-[11px] text-slate-900 dark:text-slate-100 uppercase tracking-widest block mb-1">Editoren</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                    Können Artikel pflegen, Bestände buchen und Inventur machen.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <span className="font-black text-[11px] text-slate-900 dark:text-slate-100 uppercase tracking-widest block mb-1">Viewer</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                    Reiner Lesezugriff auf Berichte, Listen und Details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
