"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { getSettings, updateSetting, deleteAllArticles } from "./actions";
import { articleService } from "@/modules/articles/services/articleService";
import { importExportService } from "@/modules/articles/services/importExportService";
import { 
  Settings, 
  Store, 
  Activity, 
  Database, 
  Save, 
  FileDown, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    app_name: "InventarApp",
    default_unit: "Stück",
    warning_threshold: "20"
  });

  const { theme, setTheme } = useTheme();

  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    async function load() {
      const res = await getSettings();
      if (res.success && res.settings) {
        setSettings(prev => ({ ...prev, ...res.settings }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key);
    const res = await updateSetting(key, value);
    if (res.success) {
      setSettings(prev => ({ ...prev, [key]: value }));
      toastSuccess(`Einstellung gespeichert: ${key}`);
    } else {
      toastError("Fehler beim Speichern.");
    }
    setSaving(null);
  };

  const handleExport = async () => {
    try {
      const articles = await articleService.getArticles();
      importExportService.exportArticles(articles, 'xlsx');
      toastSuccess("Export abgeschlossen.");
    } catch (err) {
      toastError("Export fehlgeschlagen.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("WARNUNG: Dies wird ALLE Artikel unwiderruflich löschen! Möchtest du wirklich fortfahren?")) return;
    if (!confirm("BITTE BESTÄTIGEN: Wirklich alle Daten entfernen?")) return;

    setSaving('delete-all');
    const res = await deleteAllArticles();
    if (res.success) {
      toastSuccess("Inventar vollständig geleert.");
    } else {
      toastError("Fehler beim Löschen der Daten.");
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-element border border-primary/20 text-primary">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] font-bold font-mono text-secondary uppercase tracking-[0.2em] mb-1">
            [ SYSTEM CONFIG ]
          </div>
          <h1 className="text-2xl font-bold font-sora text-foreground uppercase tracking-tight">Einstellungen</h1>
          <p className="text-xs text-foreground/60 font-sans">Globale App-Konfiguration und Datenpflege</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Profile */}
        <div className="glass-panel p-6 flex flex-col bg-surface-1/40">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">App-Profil</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-2 pl-1">Name des Inventars</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings.app_name}
                  onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                  className="block w-full py-2 px-3 text-foreground bg-surface-2 border border-outline rounded-element focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold placeholder:text-foreground/30 transition-all"
                />
                <button 
                  onClick={() => handleUpdate('app_name', settings.app_name)}
                  disabled={saving === 'app_name'}
                  className="p-2 bg-primary hover:bg-primary-hover text-white rounded-element transition-all shadow-sm disabled:opacity-50 active:scale-95 flex items-center justify-center"
                >
                  {saving === 'app_name' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Logic */}
        <div className="glass-panel p-6 flex flex-col bg-surface-1/40">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">Inventar-Logik</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-2 pl-1">Standard-Einheit</label>
                <select 
                  value={settings.default_unit}
                  onChange={(e) => handleUpdate('default_unit', e.target.value)}
                  className="block w-full py-2 px-3 text-foreground bg-surface-2 border border-outline rounded-element focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold transition-all appearance-none cursor-pointer"
                >
                  {['Stück', 'kg', 'g', 'l', 'ml'].map(u => <option key={u} value={u} className="dark:bg-slate-900">{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-foreground/60 uppercase tracking-widest mb-2 pl-1">Warnschwelle (%)</label>
                <input 
                  type="number" 
                  value={settings.warning_threshold}
                  onBlur={(e) => handleUpdate('warning_threshold', e.target.value)}
                  onChange={(e) => setSettings({...settings, warning_threshold: e.target.value})}
                  className="block w-full py-2 px-3 text-foreground bg-surface-2 border border-outline rounded-element focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm font-bold transition-all"
                />
              </div>
            </div>
            <p className="text-[9px] text-foreground/50 font-mono uppercase tracking-wider mt-auto leading-normal">Warnschwelle definiert, ab wie viel Prozent des Mindestbestands ein Artikel optisch hervorgehoben wird.</p>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="glass-panel p-6 flex flex-col bg-surface-1/40 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">Erscheinungsbild</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { id: 'light', label: 'Hell', icon: Sun },
              { id: 'dark', label: 'Dunkel', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-element font-bold text-xs uppercase tracking-wider font-mono transition-all border
                  ${theme === t.id 
                    ? 'bg-primary text-white border-primary shadow-sm scale-[1.01]' 
                    : 'bg-surface-2 text-foreground/60 hover:text-foreground hover:bg-surface-2/80 border-outline'}
                `}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-foreground/50 font-mono uppercase tracking-wider mt-4">
            Wähle dein bevorzugtes Design oder lass die App automatisch deinem System folgen.
          </p>
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="glass-panel p-6 bg-surface-1/40">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-foreground uppercase tracking-wider font-mono text-xs">Daten-Wartung</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-3 bg-surface-2 hover:bg-surface-2/80 text-foreground border border-outline rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            <FileDown className="w-4 h-4 text-primary" />
            Excel-Export (.xlsx)
          </button>

          <button 
            onClick={handleDeleteAll}
            disabled={saving === 'delete-all'}
            className="flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 rounded-element font-bold text-xs font-mono uppercase tracking-widest transition-all shadow-sm active:scale-95 group"
          >
            {saving === 'delete-all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            Alle Artikel löschen
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-element flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed font-sans">
            <span className="font-black uppercase tracking-widest block mb-1 text-amber-500 font-mono">Achtung:</span> Das Löschen der Artikel kann nicht rückgängig gemacht werden. Alle Bestände, QR-Codes und Kommentare werden vollständig entfernt.
          </p>
        </div>
      </div>
    </div>
  );
}
