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
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 rounded-3xl">
          <Settings className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Einstellungen</h1>
          <p className="text-sm font-bold text-slate-600">Globale App-Konfiguration und Datenpflege</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* App Profile */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full ring-1 ring-slate-100/50">
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-5 h-5 text-accent" />
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">App-Profil</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Name des Inventars</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={settings.app_name}
                  onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-accent sm:text-sm font-bold"
                />
                <button 
                  onClick={() => handleUpdate('app_name', settings.app_name)}
                  disabled={saving === 'app_name'}
                  className="p-2.5 bg-accent hover:bg-indigo-500 text-white rounded-3xl transition-all shadow-sm active:scale-90"
                >
                  {saving === 'app_name' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Logic */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full ring-1 ring-slate-100/50">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Inventar-Logik</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-8 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Standard-Einheit</label>
                <select 
                  value={settings.default_unit}
                  onChange={(e) => handleUpdate('default_unit', e.target.value)}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-accent sm:text-sm font-bold appearance-none"
                >
                  {['Stück', 'kg', 'g', 'l', 'ml'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Warnschwelle (%)</label>
                <input 
                  type="number" 
                  value={settings.warning_threshold}
                  onBlur={(e) => handleUpdate('warning_threshold', e.target.value)}
                  onChange={(e) => setSettings({...settings, warning_threshold: e.target.value})}
                  className="block w-full rounded-3xl border-0 py-2.5 px-4 text-slate-900 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-accent sm:text-sm font-bold"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-600 font-bold italic mt-auto">Warnschwelle definiert, ab wie viel Prozent des Mindestbestands ein Artikel optisch hervorgehoben wird.</p>
          </div>
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 ring-1 ring-slate-100/50">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-accent" />
          <h2 className="font-black text-slate-900 uppercase tracking-tight text-sm">Daten-Wartung</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-200 shadow-sm active:scale-[0.98]"
          >
            <FileDown className="w-5 h-5 text-accent" />
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
        
        <div className="mt-4 p-8 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-bold leading-relaxed">
            <span className="font-black uppercase tracking-widest block mb-1 text-amber-600">Achtung:</span> Das Löschen der Artikel kann nicht rückgängig gemacht werden. Alle Bestände, QR-Codes und Kommentare werden vollständig entfernt.
          </p>
        </div>
      </div>
    </div>
  );
}
