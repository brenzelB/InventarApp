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
  purchase_price: 0,
  bestand: 0,
  mindestbestand: 0,
  group_id: null,
  lagerort: '',
  unit: 'Stück',
  tax_rate: 19,
};

const ALL_UNITS = ['Stück', 'kg', 'g', 'l', 'ml'];

const getStep = (unit: string) => (unit === 'kg' || unit === 'l' ? '0.1' : '1');

export function ArticleForm({ initialData, articleId, qrCode, onUpdate }: ArticleFormProps) {
  const [formData, setFormData] = useState<ArticleFormData>(initialData || defaultData);
  const [groups, setGroups] = useState<Group[]>([]);
  const { create, update, loading, error } = useArticleMutations();
  const [success, setSuccess] = useState(false);
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

    if (formData.herstellpreis < 0 || formData.verkaufspreis < 0 || formData.purchase_price < 0) {
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      {error && (
        <div className="bg-red-50 p-4 rounded-3xl border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-red-700 text-sm font-semibold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-3xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 text-sm font-semibold">Erfolgreich gespeichert! Leite weiter...</p>
        </div>
      )}

      {articleId && (
        <div className="flex flex-col items-center md:items-end mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Artikel QR-Code</label>
          <QRCodeView svgString={qrCode} name={formData.name} articleId={articleId} size="lg" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-900">Name *</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-900">SKU (Artikelnummer) *</label>
          <input required type="text" name="sku" value={formData.sku} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-slate-900">Gruppe</label>
          <select 
            name="group_id" 
            value={formData.group_id || ''} 
            onChange={handleChange}
            className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.5em_1.5em]"
            disabled={loading || isReadOnly}
          >
            <option value="">Keine Gruppe</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
        <label className="block text-sm font-semibold text-slate-900">Lagerort (z.B. Regal A, Fach 3)</label>
        <input type="text" name="lagerort" value={formData.lagerort || ''} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" placeholder="z.B. Regal A, Fach 3" disabled={loading || isReadOnly}/>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900">Beschreibung</label>
        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <label className="block text-sm font-semibold text-slate-900">Herstellpreis (€) *</label>
          <input required type="number" step="0.01" min="0" name="herstellpreis" value={formData.herstellpreis} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">Einkaufspreis (€) *</label>
          <input required type="number" step="0.01" min="0" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">Verkaufspreis (€) *</label>
          <input required type="number" step="0.01" min="0" name="verkaufspreis" value={formData.verkaufspreis} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">Steuersatz (%) *</label>
          <select 
            name="tax_rate" 
            value={formData.tax_rate} 
            onChange={handleChange}
            className="mt-2 block w-full rounded-3xl border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.2em_1.2em]"
            disabled={loading || isReadOnly}
          >
            <option value={19}>19 % (Standard)</option>
            <option value={7}>7 % (Ermäßigt)</option>
            <option value={0}>0 % (Steuerfrei)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        <div className="relative">
          <label className="block text-sm font-semibold text-slate-900">Bestand *</label>
          <div className="relative mt-2">
            <input 
              required 
              type="number" 
              step={getStep(formData.unit)} 
              name="bestand" 
              value={formData.bestand} 
              onChange={handleChange} 
              className="block w-full rounded-3xl border-0 py-2.5 pl-3 pr-16 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" 
              disabled={loading || isReadOnly}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-slate-400 sm:text-sm font-black uppercase">{formData.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <label className="block text-sm font-semibold text-slate-900">Einheit *</label>
          <div className="grid grid-cols-5 gap-1">
            {ALL_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                disabled={loading || isReadOnly}
                onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                title={u}
                className={`
                  h-[44px] flex items-center justify-center rounded-3xl text-[10px] font-black uppercase transition-all active:scale-95 ring-1 ring-inset
                  ${formData.unit === u 
                    ? 'bg-accent ring-indigo-600 text-white shadow-sm border border-slate-200' 
                    : 'bg-slate-50 ring-slate-300 text-slate-500 hover:ring-slate-400'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">Mindestbestand *</label>
          <input required type="number" step={getStep(formData.unit)} name="mindestbestand" value={formData.mindestbestand} onChange={handleChange} className="mt-2 block w-full rounded-3xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-accent sm:text-sm sm:leading-6 disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 gap-8">
        <button type="button" onClick={() => router.push('/dashboard/articles')} disabled={loading} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-3xl transition-colors disabled:opacity-50">
          Abbrechen
        </button>
        {isReadOnly ? (
          <div className="flex-1 text-sm text-amber-600 font-semibold bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
            Nur Lesezugriff
          </div>
        ) : (
          <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-indigo-500 rounded-3xl shadow-sm transition-colors disabled:opacity-50 flex items-center">
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
        )}
      </div>
    </form>
  );
}
