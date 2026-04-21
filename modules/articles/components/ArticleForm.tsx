"use client";

import { useState, SyntheticEvent, useEffect } from 'react';
import { ArticleFormData, Group } from '../types';
import { useArticleMutations } from '../hooks/useArticleMutations';
import { groupService } from '../services/groupService';
import { useRouter } from 'next/navigation';
import { QRCodeView } from "@/components/QRCodeView";
import { AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface ArticleFormProps {
  initialData?: ArticleFormData;
  articleId?: string; // If provided, we're in edit mode
  qrCode?: string | null;
  onUpdate?: (data: Partial<ArticleFormData>) => Promise<any>;
}

const defaultData: ArticleFormData = {
  name: '',
  sku: '',
  description: '',
  herstellpreis: 0,
  verkaufspreis: 0,
  bestand: 0,
  mindestbestand: 0,
  group_id: null,
  lagerort: '',
  unit: 'Stück',
};

export function ArticleForm({ initialData, articleId, qrCode, onUpdate }: ArticleFormProps) {
  const [formData, setFormData] = useState<ArticleFormData>(initialData || defaultData);
  const [groups, setGroups] = useState<Group[]>([]);
  const { create, update, loading, error } = useArticleMutations();
  const [success, setSuccess] = useState(false);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const { role } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();
  
  const isReadOnly = role === 'viewer';

  useEffect(() => {
    groupService.getGroups().then(setGroups).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : (value === "" && name === "group_id" ? null : value)
    }));
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setSuccess(false);
    console.log("[Form] Form submission started for article:", articleId || "New");

    if (formData.herstellpreis < 0 || formData.verkaufspreis < 0) {
      toastError("Preise dürfen nicht negativ sein.");
      return;
    }

    try {
      if (articleId) {
        console.log("[Form] Calling update with data:", formData);
        
        let res;
        if (onUpdate) {
          res = await onUpdate(formData);
        } else {
          res = await update(articleId, formData);
        }

        console.log("[Form] Update call returned:", res);
        
        if (res) {
          setSuccess(true);
          toastSuccess("Artikel erfolgreich aktualisiert.");
          setTimeout(() => router.push('/dashboard/articles'), 1500);
        }
      } else {
        const res = await create(formData);
        if (res) {
          setSuccess(true);
          setTimeout(() => router.push('/dashboard/articles'), 1500);
        }
      }
    } catch (err: any) {
      console.error("[Form] Unexpected submission error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 dark:text-green-400 text-sm font-medium">Erfolgreich gespeichert! Leite weiter...</p>
        </div>
      )}

      {articleId && (
        <div className="flex flex-col items-center md:items-end mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Artikel QR-Code</label>
          <QRCodeView svgString={qrCode} name={formData.name} articleId={articleId} size="lg" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Name *</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">SKU (Artikelnummer) *</label>
          <input required type="text" name="sku" value={formData.sku} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Gruppe</label>
          <select 
            name="group_id" 
            value={formData.group_id || ''} 
            onChange={handleChange}
            className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em_1.5em]"
            disabled={loading || isReadOnly}
          >
            <option value="">Keine Gruppe</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Lagerort (z.B. Regal A, Fach 3)</label>
          <input type="text" name="lagerort" value={formData.lagerort || ''} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" placeholder="z.B. Regal A, Fach 3" disabled={loading || isReadOnly}/>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Einheit *</label>
          <div className="mt-2 relative">
            <button
              type="button"
              onClick={() => !isReadOnly && setIsUnitOpen(!isUnitOpen)}
              disabled={loading || isReadOnly}
              className="relative w-full bg-slate-50 dark:bg-slate-900 border-0 rounded-md py-2.5 pl-3 pr-10 text-left text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="block truncate font-bold">{formData.unit}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
              </span>
            </button>

            {isUnitOpen && (
              <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-slate-800 py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-200">
                {['Stück', 'kg', 'g', 'l', 'ml'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`
                      relative w-full cursor-default select-none py-2.5 pl-3 pr-9 text-left transition-colors
                      ${formData.unit === u ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-900 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                    `}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, unit: u }));
                      setIsUnitOpen(false);
                    }}
                  >
                    <span className={`block truncate ${formData.unit === u ? 'font-black' : 'font-medium'}`}>{u}</span>
                    {formData.unit === u && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Beschreibung</label>
        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Herstellpreis (€) *</label>
          <input required type="number" step="0.01" min="0" name="herstellpreis" value={formData.herstellpreis} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Verkaufspreis (€) *</label>
          <input required type="number" step="0.01" min="0" name="verkaufspreis" value={formData.verkaufspreis} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        <div className="relative">
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Bestand *</label>
          <div className="relative mt-2">
            <input 
              required 
              type="number" 
              step="0.01" 
              name="bestand" 
              value={formData.bestand} 
              onChange={handleChange} 
              className="block w-full rounded-md border-0 py-2.5 pl-3 pr-16 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" 
              disabled={loading || isReadOnly}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-slate-400 sm:text-sm font-black uppercase">{formData.unit}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200">Mindestbestand *</label>
          <input required type="number" step="0.01" name="mindestbestand" value={formData.mindestbestand} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700 gap-4">
        <button type="button" onClick={() => router.push('/dashboard/articles')} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50">
          Abbrechen
        </button>
        {isReadOnly ? (
          <div className="flex-1 text-sm text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-100 dark:border-amber-800/50">
            Nur Lesezugriff
          </div>
        ) : (
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center">
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
        )}
      </div>
    </form>
  );
}
