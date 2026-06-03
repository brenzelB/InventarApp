"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Mail, 
  Settings, 
  LogOut, 
  Key, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  LucideIcon,
  Ghost,
  Cat,
  Dog,
  Heart,
  Star,
  Sparkles,
  Loader2,
  Users
} from "lucide-react";
import { articleService } from "@/modules/articles/services/articleService";

const avatarIcons = [
  { id: 'user', icon: User, label: 'Standard' },
  { id: 'ghost', icon: Ghost, label: 'Geist' },
  { id: 'cat', icon: Cat, label: 'Katze' },
  { id: 'dog', icon: Dog, label: 'Hund' },
  { id: 'heart', icon: Heart, label: 'Herz' },
  { id: 'star', icon: Star, label: 'Stern' },
  { id: 'sparkles', icon: Sparkles, label: 'Glitzer' },
];

export default function ProfilePage() {
  const { user, updateProfile, forgotPassword, logout, role } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [avatarId, setAvatarId] = useState(user?.user_metadata?.avatar_id || "user");
  const [articleCount, setArticleCount] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    articleService.getArticles().then(data => setArticleCount(data.length)).catch(() => setArticleCount(0));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    const { error } = await updateProfile({ display_name: displayName, avatar_id: avatarId });
    if (error) {
      setMessage({ text: error, type: 'error' });
    } else {
      setMessage({ text: "Profil erfolgreich aktualisiert!", type: 'success' });
    }
    setIsUpdating(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    setMessage(null);
    const { error } = await forgotPassword(user.email);
    if (error) {
      setMessage({ text: error, type: 'error' });
    } else {
      setMessage({ text: "E-Mail zum Zurücksetzen des Passworts wurde gesendet!", type: 'success' });
    }
    setIsResetting(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profil Header */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden bg-surface-1/40">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Settings className="w-32 h-32 rotate-12 text-foreground" />
        </div>
        <div className="relative z-10 w-20 h-20 rounded-card bg-primary flex items-center justify-center text-white ring-2 ring-primary/20 shadow-md">
          {(() => {
             const IconComp = avatarIcons.find(a => a.id === avatarId)?.icon || User;
             return <IconComp className="w-10 h-10" />;
          })()}
        </div>
        <div className="relative z-10 text-center sm:text-left">
          <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
            [ USER PROFILE ]
          </div>
          <h2 className="text-2xl font-bold font-sora text-foreground uppercase tracking-tight font-black leading-tight">
            {user.user_metadata?.display_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-foreground/60 font-mono text-xs flex items-center justify-center sm:justify-start gap-2 mt-1">
            <Mail className="w-3.5 h-3.5 text-primary" /> {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Haupt-Einstellungen */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 bg-surface-1/40">
            <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-2 mb-6">
              <Settings className="w-4 h-4 text-primary" />
              Persönliche Daten
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-2 pl-1">E-Mail Adresse (fest)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-foreground/30" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full pl-9 pr-3 py-2 bg-surface-2/40 border border-outline rounded-element text-foreground/50 cursor-not-allowed text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-2 pl-1">Anzeigename</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-foreground/45" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name..."
                    className="block w-full pl-9 pr-3 py-2 bg-surface-2 border border-outline rounded-element text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-4 pl-1">Profil-Avatar wählen</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {avatarIcons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAvatarId(item.id)}
                      className={`
                        p-2.5 rounded-element flex items-center justify-center transition-all border
                        ${avatarId === item.id 
                          ? 'bg-primary text-white border-primary shadow-sm' 
                          : 'bg-surface-2 text-foreground/60 hover:text-foreground hover:bg-surface-2/80 border-outline'}
                      `}
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-element flex items-center gap-3 text-xs font-mono uppercase tracking-wider border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Einstellungen speichern
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 bg-surface-1/40">
             <h3 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-primary" />
              Sicherheit
            </h3>
            <p className="text-xs text-foreground/60 mb-6 font-sans leading-relaxed">
              Du kannst jederzeit dein Passwort ändern. Wir senden dir dazu eine E-Mail mit einem Bestätigungslink an deine hinterlegte Adresse.
            </p>
            <button
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-surface-0 hover:bg-surface-2 text-foreground border border-outline rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm"
            >
              {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Passwort zurücksetzen
            </button>
          </div>
        </div>

        {/* Sidebar Widgets (Stats & Logout) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 text-foreground relative overflow-hidden group bg-surface-1/40 border border-outline border-l-4 border-l-primary">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
               <Package className="w-20 h-20 rotate-12 text-foreground" />
            </div>
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] mb-4 text-foreground/50">[ DEINE STATISTIK ]</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black font-mono tracking-tight text-foreground">{articleCount !== null ? articleCount : '...'}</span>
              <span className="text-sm font-bold font-mono text-foreground/70 uppercase">Artikel</span>
            </div>
            <p className="mt-4 text-[10px] font-mono text-foreground/50 leading-relaxed uppercase tracking-wider">
              Insgesamt im Inventar-System erfasste Artikel.
            </p>
          </div>

          <div className="glass-panel p-6 bg-surface-1/40 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-[0.03] pointer-events-none">
               <LogOut className="w-16 h-16 -rotate-12 text-foreground" />
            </div>
            <h3 className="text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-[0.2em] mb-6 relative z-10">AUSLOGGEN</h3>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all group relative z-10"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              ABMELDEN
            </button>
          </div>

          {role === 'admin' && (
            <div className="glass-panel p-6 bg-surface-1/40 overflow-hidden relative animate-in slide-in-from-right-4 duration-500">
              <div className="absolute top-0 right-0 p-2 opacity-[0.03] pointer-events-none">
                <Users className="w-16 h-16 -rotate-12 text-foreground" />
              </div>
              <h3 className="text-[10px] font-bold font-mono text-primary uppercase tracking-[0.2em] mb-6 relative z-10">ADMINISTRATION</h3>
              <a 
                href="/dashboard/team"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all shadow-sm relative z-10"
              >
                <Users className="w-3.5 h-3.5" />
                TEAM VERWALTEN
              </a>
            </div>
          )}
        </div>
      </div>

      {/* DEBUG INFO */}
      <div className="mt-12 pt-8 border-t border-outline text-center">
        <p className="text-[10px] font-bold font-mono text-foreground/40 uppercase tracking-[0.3em]">
          DEBUG: Aktuelle Rolle laut System: <span className="text-primary font-bold">{role}</span>
        </p>
      </div>
    </div>
  );
}
