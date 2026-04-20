"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export default function TeamPage() {
  const { user, role } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      fetchTeamData();
    }
  }, [role]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('invitations').select('*').order('created_at', { ascending: false })
      ]);

      if (pRes.data) setProfiles(pRes.data);
      if (iRes.data) setInvitations(iRes.data);
    } catch (err) {
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('invitations').insert({
        email: inviteEmail,
        role: inviteRole,
        invited_by: user?.id
      });

      if (error) {
        setMessage({ text: "Einladung fehlgeschlagen: " + error.message, type: 'error' });
      } else {
        setMessage({ text: "Einladung an " + inviteEmail + " gesendet!", type: 'success' });
        setInviteEmail("");
        fetchTeamData();
      }
    } catch (err) {
      setMessage({ text: "Unerwarteter Fehler beim Einladen.", type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteMember = async (id: string, email: string) => {
    if (id === user?.id) {
       alert("Du kannst dich nicht selbst löschen.");
       return;
    }
    if (!confirm(`Mitglied ${email} wirklich aus dem Team entfernen?`)) return;

    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert("Löschen fehlgeschlagen: " + error.message);
    else fetchTeamData();
  };

  const handleDeleteInvitation = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) alert("Löschen fehlgeschlagen: " + error.message);
    else fetchTeamData();
  };

  const handleUpdateRole = async (id: string, newRole: 'admin' | 'editor' | 'viewer') => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) alert("Rollen-Update fehlgeschlagen: " + error.message);
    else fetchTeamData();
  };

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50 dark:ring-red-900/20">
           <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Zugriff verweigert</h1>
        <p className="text-slate-100 font-medium mt-2 max-w-md bg-slate-900 px-4 py-2 rounded-full text-xs">Nur Administratoren können die Team-Verwaltung einsehen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-black leading-7 text-slate-900 dark:text-white sm:truncate sm:tracking-tight uppercase tracking-tighter">
            Team-Verwaltung
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Verwalte deine Teammitglieder, Einladungen und Rollen für eine sichere Zusammenarbeit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mitglieder Liste */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Aktuelle Teammitglieder</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Mail</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rolle</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-px">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        {profile.display_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {profile.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          disabled={profile.id === user?.id}
                          value={profile.role}
                          onChange={(e) => handleUpdateRole(profile.id, e.target.value as any)}
                          className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-0 cursor-pointer disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteMember(profile.id, profile.email)}
                          disabled={profile.id === user?.id}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-10"
                          title="Mitglied entfernen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Lade Team-Daten...</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {invitations.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Ausstehende Einladungen</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300">
                          {invite.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-amber-600 uppercase font-black tracking-widest">
                          {invite.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleDeleteInvitation(invite.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Einladung zurückziehen"
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

        {/* Einladungs-Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <UserPlus className="w-32 h-32 rotate-12" />
            </div>
            <h3 className="text-xl font-black mb-6 relative z-10 uppercase tracking-tighter">
              Nutzer einladen
            </h3>
            <form onSubmit={handleInvite} className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 pl-1">E-Mail Adresse</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-indigo-200" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@firma.de"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-bold transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 pl-1">Rolle zuweisen</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-black uppercase tracking-widest appearance-none cursor-pointer group"
                >
                  <option value="viewer" className="text-slate-900 font-bold">Viewer (Nur Lesen)</option>
                  <option value="editor" className="text-slate-900 font-bold">Editor (Bearbeiten)</option>
                  <option value="admin" className="text-slate-900 font-bold">Admin (Volle Rechte)</option>
                </select>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-white/20 text-white' : 'bg-red-500/50 text-white border border-red-400'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isInviting}
                className="w-full bg-white text-indigo-600 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                Einladung senden
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Rollen-Details</h4>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <span className="font-black text-[10px] text-slate-900 dark:text-white uppercase tracking-widest block mb-1">Admins</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Volle Kontrolle über Team, Artikel und alle Systemeinstellungen.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <span className="font-black text-[10px] text-slate-900 dark:text-white uppercase tracking-widest block mb-1">Editoren</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Können Artikel anlegen und bearbeiten, aber keine Nutzer verwalten.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center flex-shrink-0 text-slate-400">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <span className="font-black text-[10px] text-slate-900 dark:text-white uppercase tracking-widest block mb-1">Viewer</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Dürfen alles sehen und exportieren, aber nichts verändern.
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
