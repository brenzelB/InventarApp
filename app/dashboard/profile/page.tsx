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
  Loader2
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
  const { user, updateProfile, forgotPassword, logout } = useAuth();
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profil Header */}
      <div className="flex items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Settings className="w-32 h-32 rotate-12" />
        </div>
        <div className="relative z-10 w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-4 ring-indigo-50 dark:ring-indigo-900/30 shadow-2xl">
          {(() => {
             const IconComp = avatarIcons.find(a => a.id === avatarId)?.icon || User;
             return <IconComp className="w-12 h-12" />;
          })()}
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
            {user.user_metadata?.display_name || user.email?.split('@')[0]}
          </h2>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4 text-indigo-500" /> {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Haupt-Einstellungen */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Persönliche Daten
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">E-Mail Adresse (fest)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 cursor-not-allowed sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 pl-1">Anzeigename</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Dein Name..."
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm transition-all shadow-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-1">Profil-Avatar wählen</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {avatarIcons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAvatarId(item.id)}
                      className={`
                        p-3 rounded-2xl flex items-center justify-center transition-all
                        ${avatarId === item.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}
                      `}
                      title={item.label}
                    >
                      <item.icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Einstellungen speichern
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" />
              Sicherheit
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Du kannst jederzeit dein Passwort ändern. Wir senden dir dazu eine E-Mail mit einem Bestätigungslink an deine hinterlegte Adresse.
            </p>
            <button
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl disabled:opacity-50"
            >
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Passwort zurücksetzen
            </button>
          </div>
        </div>

        {/* Sidebar Widgets (Stats & Logout) */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Package className="w-24 h-24 rotate-12" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-80">DEINE STATISTIK</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter">{articleCount !== null ? articleCount : '...'}</span>
              <span className="text-lg font-bold opacity-80">ARTIKEL</span>
            </div>
            <p className="mt-4 text-[11px] font-medium opacity-70 leading-relaxed uppercase tracking-widest text-indigo-100">
              Insgesamt im Inventar-System erfasste Artikel.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-5">
               <LogOut className="w-16 h-16 -rotate-12" />
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10">AUSLOGGEN</h3>
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all group relative z-10"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              ABMELDEN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
