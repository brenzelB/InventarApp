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
  AlertTriangle 
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    app_name: "InventarApp",
    default_unit: "Stück",
    warning_threshold: "20"
  });

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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Einstellungen</h1>
          <p className="text-sm text-slate-500">Globale App-Konfiguration und Datenpflege</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 dark:text-white">App-Profil</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Name des Inventars</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings.app_name}
                  onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                  className="block w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
                <button 
                  onClick={() => handleUpdate('app_name', settings.app_name)}
                  disabled={saving === 'app_name'}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md active:scale-90"
                >
                  {saving === 'app_name' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Logic */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 dark:text-white">Inventar-Logik</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Standard-Einheit</label>
                <select 
                  value={settings.default_unit}
                  onChange={(e) => handleUpdate('default_unit', e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                >
                  {['Stück', 'kg', 'g', 'l', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Warnschwellenwert (%)</label>
                <input 
                  type="number" 
                  value={settings.warning_threshold}
                  onBlur={(e) => handleUpdate('warning_threshold', e.target.value)}
                  onChange={(e) => setSettings({...settings, warning_threshold: e.target.value})}
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-auto">Warnschwelle definiert, ab wie viel Prozent des Mindestbestands ein Artikel optisch hervorgehoben wird.</p>
          </div>
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">Daten-Wartung</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-[0.98]"
          >
            <FileDown className="w-5 h-5 text-indigo-600" />
            Excel-Export (.xlsx)
          </button>

          <button 
            onClick={handleDeleteAll}
            disabled={saving === 'delete-all'}
            className="flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border border-red-100 dark:border-red-900/30 shadow-sm active:scale-[0.98] group"
          >
            {saving === 'delete-all' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Alle Artikel löschen
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
            <span className="font-black uppercase">Achtung:</span> Das Löschen der Artikel kann nicht rückgängig gemacht werden. Alle Bestände, QR-Codes und Kommentare werden vollständig entfernt.
          </p>
        </div>
      </div>
    </div>
  );
}
