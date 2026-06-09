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
  display_name?: string;
  full_name?: string;
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Deny access if not admin (including email joker)
  const isAdmin = role === 'admin' || user?.email === 'brenzel.ai@gmail.com';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-card flex items-center justify-center mb-6">
           <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-sora text-foreground uppercase tracking-tight">Zugriff verweigert</h1>
        <p className="text-foreground/60 mt-4 max-w-md font-sans text-xs">
          Diese Seite ist ausschließlich Administratoren vorbehalten. Deine aktuelle Rolle ist: <span className="text-red-600 dark:text-rose-400 font-mono font-bold uppercase">{role}</span>.
        </p>
        <div className="mt-8 flex gap-4">
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-surface-0 hover:bg-surface-2 text-foreground border border-outline rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
            <RefreshCcw className="w-3.5 h-3.5" /> Aktualisieren
          </button>
          <a href="/dashboard" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
            Zum Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
            [ TEAM MANAGEMENT ]
          </div>
          <h2 className="text-3xl font-bold font-sora text-foreground uppercase tracking-tight sm:truncate">
            Team-Verwaltung
          </h2>
          <p className="text-xs text-foreground/60 font-sans mt-2">
            Zentrale Schnittstelle für Mitglieder, Berechtigungen und Einladungen.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchTeamData}
            className="p-2.5 bg-surface-0 hover:bg-surface-2 text-foreground border border-outline rounded-element transition-all shadow-sm flex items-center justify-center"
            title="Daten aktualisieren"
          >
            <RefreshCcw className={`w-4 h-4 text-foreground/75 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Mitglieder-Tabelle */}
          <div className="glass-panel bg-surface-1/40 overflow-hidden">
            <div className="p-6 border-b border-outline flex items-center justify-between bg-surface-2/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-element bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider">Teammitglieder</h3>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-element text-[10px] font-bold font-mono uppercase tracking-widest">{profiles.length} Aktiv</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-outline">
                <thead className="bg-surface-2/40 border-b border-outline">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Mitglied</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest">E-Mail</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Rolle</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline bg-surface-1/10">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="group hover:bg-surface-2/40 transition-all cursor-default">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground font-sora">
                        {(() => {
                          const hasName = profile.full_name || profile.display_name;
                          const isPending = invitations.some(inv => inv.email?.toLowerCase() === profile.email?.toLowerCase());
                          if (hasName) {
                            return profile.full_name || profile.display_name;
                          } else if (isPending) {
                            return <span className="text-amber-500 italic text-xs font-bold font-mono">Ausstehend (Eingeladen)</span>;
                          } else {
                            return <span className="text-foreground/50 font-bold">{profile.email?.split('@')[0] || 'Unbekannt'}</span>;
                          }
                        })()}
                        {profile.id === user?.id && <span className="ml-2 text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-element font-bold font-mono uppercase tracking-widest">ICH</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground/75 font-mono">
                        {profile.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          disabled={profile.id === user?.id}
                          value={profile.role}
                          onChange={(e) => handleUpdateRole(profile.id, e.target.value as any)}
                          className="bg-transparent border-none text-[10px] font-bold font-mono uppercase tracking-widest text-foreground focus:ring-0 cursor-pointer disabled:opacity-40 hover:text-primary transition-colors py-1"
                        >
                          <option value="admin" className="dark:bg-slate-900">Admin</option>
                          <option value="editor" className="dark:bg-slate-900">Editor</option>
                          <option value="viewer" className="dark:bg-slate-900">Viewer</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteMember(profile.id, profile.email)}
                          disabled={profile.id === user?.id}
                          className="text-foreground/45 hover:text-red-500 dark:hover:text-rose-400 hover:bg-red-500/10 p-1.5 rounded-element border border-transparent hover:border-red-500/20 transition-all disabled:hidden"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loading && profiles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-foreground/50 font-mono text-[10px] uppercase tracking-widest">Lade Teammitglieder...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Einladungen-Sektion */}
          {invitations.length > 0 && (
            <div className="glass-panel bg-surface-1/40 overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="p-6 border-b border-outline flex items-center gap-4 bg-surface-2/20">
                <div className="w-10 h-10 rounded-element bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider">Ausstehende Einladungen</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-outline">
                  <tbody className="divide-y divide-outline bg-surface-1/10">
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="hover:bg-surface-2/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground font-mono">{invite.email}</span>
                            {invite.metadata?.name && (
                              <span className="text-[9px] text-foreground/50 font-mono uppercase tracking-widest mt-0.5 block">{invite.metadata.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold font-mono text-amber-500 uppercase tracking-widest text-right">
                          {invite.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right w-px">
                          <button
                            onClick={() => handleDeleteInvitation(invite.id)}
                            className="text-foreground/45 hover:text-red-500 dark:hover:text-rose-400 hover:bg-red-500/10 p-1.5 rounded-element border border-transparent hover:border-red-500/20 transition-all"
                          >
                            <Trash2 size={16} />
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
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-surface-1/40 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
               <UserPlus className="w-48 h-48 rotate-12 text-foreground" />
            </div>
            <h3 className="text-base font-bold font-sora mb-6 uppercase tracking-tight text-foreground">
              Nutzer einladen
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-4 relative z-10">
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-foreground/60 pl-1">Name des Nutzers</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-foreground/45" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full bg-surface-2 border border-outline rounded-element py-1.5 pl-9 pr-3 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-foreground/60 pl-1">E-Mail Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-foreground/45" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteEmailError) setInviteEmailError(false);
                    }}
                    placeholder="name@firma.de"
                    className={`w-full bg-surface-2 border ${inviteEmailError ? 'border-red-500 ring-1 ring-red-500/50' : 'border-outline'} rounded-element py-1.5 pl-9 pr-3 text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold transition-all`}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-foreground/60 pl-1">Zukünftige Rolle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-surface-2 border border-outline rounded-element py-2 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs font-bold font-mono uppercase tracking-wider cursor-pointer appearance-none"
                >
                  <option value="viewer" className="text-foreground bg-surface-1">Viewer (Lesen)</option>
                  <option value="editor" className="text-foreground bg-surface-1">Editor (Schreiben)</option>
                  <option value="admin" className="text-foreground bg-surface-1 font-bold">Admin (Vollzugriff)</option>
                </select>
              </div>

              {message && (
                <div className={`p-4 rounded-element flex items-center gap-3 text-xs font-mono uppercase tracking-wider border ${message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-primary hover:bg-primary-hover text-white rounded-element py-2.5 text-xs font-bold font-mono uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-sm"
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                Einladung senden
              </button>
            </form>
          </div>

          {/* Rollen-Info-Card */}
          <div className="glass-panel p-6 bg-surface-1/40 space-y-6">
            <h4 className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-[0.2em] pl-1">Berechtigungen</h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-element bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-bold font-mono text-[10px] text-foreground uppercase tracking-widest block mb-1">Admins</span>
                  <p className="text-xs text-foreground/60 leading-normal font-sans">
                    Volle Team-Verwaltung, Artikel-Manipulation und Systemzugriff.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-element bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="font-bold font-mono text-[10px] text-foreground uppercase tracking-widest block mb-1">Editoren</span>
                  <p className="text-xs text-foreground/60 leading-normal font-sans">
                    Können Artikel pflegen, Bestände buchen und Inventur machen.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-element bg-surface-2 border border-outline flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-foreground/50" />
                </div>
                <div>
                  <span className="font-bold font-mono text-[10px] text-foreground uppercase tracking-widest block mb-1">Viewer</span>
                  <p className="text-xs text-foreground/60 leading-normal font-sans">
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
