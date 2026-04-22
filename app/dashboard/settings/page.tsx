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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-3xl">
          <Settings className="w-6 h-6 text-slate-700 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Einstellungen</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Globale App-Konfiguration und Datenpflege</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Profile */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full ring-1 ring-slate-100/50 dark:ring-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-5 h-5 text-slate-700 dark:text-slate-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-sm">App-Profil</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2">Name des Inventars</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings.app_name}
                  onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-accent sm:text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button 
                  onClick={() => handleUpdate('app_name', settings.app_name)}
                  disabled={saving === 'app_name'}
                  className="p-2.5 bg-accent hover:bg-indigo-500 text-white rounded-3xl transition-all shadow-sm dark:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-90"
                >
                  {saving === 'app_name' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Logic */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full ring-1 ring-slate-100/50 dark:ring-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-slate-700 dark:text-slate-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-sm">Inventar-Logik</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2">Standard-Einheit</label>
                <select 
                  value={settings.default_unit}
                  onChange={(e) => handleUpdate('default_unit', e.target.value)}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-accent sm:text-sm font-bold appearance-none"
                >
                  {['Stück', 'kg', 'g', 'l', 'ml'].map(u => <option key={u} value={u} className="dark:bg-slate-900">{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2">Warnschwelle (%)</label>
                <input 
                  type="number" 
                  value={settings.warning_threshold}
                  onBlur={(e) => handleUpdate('warning_threshold', e.target.value)}
                  onChange={(e) => setSettings({...settings, warning_threshold: e.target.value})}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-accent sm:text-sm font-bold"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold italic mt-auto uppercase tracking-widest">Warnschwelle definiert, ab wie viel Prozent des Mindestbestands ein Artikel optisch hervorgehoben wird.</p>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full ring-1 ring-slate-100/50 dark:ring-slate-800/50 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-5 h-5 text-slate-700 dark:text-slate-400" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-sm">Erscheinungsbild</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { id: 'light', label: 'Hell', icon: Sun },
              { id: 'dark', label: 'Dunkel', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`
                  flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all border
                  ${theme === t.id 
                    ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(59,130,246,0.2)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02]' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}
                `}
              >
                <t.icon className="w-5 h-5" />
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 font-bold italic mt-4 uppercase tracking-widest">
            Wähle dein bevorzugtes Design oder lass die App automatisch deinem System folgen.
          </p>
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 ring-1 ring-slate-100/50 dark:ring-slate-800/50">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-slate-700 dark:text-slate-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight text-sm">Daten-Wartung</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98]"
          >
            <FileDown className="w-5 h-5 text-slate-700 dark:text-slate-400" />
            Excel-Export (.xlsx)
          </button>

          <button 
            onClick={handleDeleteAll}
            disabled={saving === 'delete-all'}
            className="flex items-center justify-center gap-3 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-[0.98] group"
          >
            {saving === 'delete-all' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Alle Artikel löschen
          </button>
        </div>
        
        <div className="mt-4 p-8 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-400 font-bold leading-relaxed">
            <span className="font-black uppercase tracking-widest block mb-1 text-amber-600 dark:text-amber-400">Achtung:</span> Das Löschen der Artikel kann nicht rückgängig gemacht werden. Alle Bestände, QR-Codes und Kommentare werden vollständig entfernt.
          </p>
        </div>
      </div>
    </div>
  );
}
