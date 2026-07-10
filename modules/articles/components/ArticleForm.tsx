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
    <form onSubmit={handleSubmit} className="space-y-6 bg-widget p-8 rounded-card border border-outline shadow-sm bg-grid-pattern bg-opacity-5">
      {error && (
        <div className="bg-primary/10 p-4 rounded-element border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-element bg-primary/20 flex items-center justify-center text-primary">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-primary text-xs font-bold font-mono uppercase tracking-wider">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-secondary/10 p-4 rounded-element border border-secondary/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0 w-8 h-8 rounded-element bg-secondary/20 flex items-center justify-center text-secondary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-secondary text-xs font-bold font-mono uppercase tracking-wider">Erfolgreich gespeichert! Leite weiter...</p>
        </div>
      )}

      {articleId && (
        <div className="flex flex-col items-center md:items-end mb-4">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 mb-2 uppercase tracking-widest">Artikel QR-Code</label>
          <QRCodeView svgString={qrCode} name={formData.name} articleId={articleId} size="lg" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Name *</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">SKU (Artikelnummer) *</label>
          <input required type="text" name="sku" value={formData.sku} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div className="md:col-span-1">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Gruppe</label>
          <select 
            name="group_id" 
            value={formData.group_id || ''} 
            onChange={handleChange}
            className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50 appearance-none bg-no-repeat bg-[right_0.5rem_center]"
            disabled={loading || isReadOnly}
          >
            <option value="" className="bg-surface-0 text-foreground">Keine Gruppe</option>
            {groups.map(group => (
              <option key={group.id} value={group.id} className="bg-surface-0 text-foreground">{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
        <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Lagerort (z.B. Regal A, Fach 3)</label>
        <input type="text" name="lagerort" value={formData.lagerort || ''} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" placeholder="z.B. Regal A, Fach 3" disabled={loading || isReadOnly}/>
      </div>

      <div>
        <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Beschreibung</label>
        <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Herstellpreis (€) *</label>
          <input required type="number" step="any" min="0" name="herstellpreis" value={formData.herstellpreis} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Einkaufspreis (€) *</label>
          <input required type="number" step="any" min="0" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Verkaufspreis (€) *</label>
          <input required type="number" step="any" min="0" name="verkaufspreis" value={formData.verkaufspreis} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>

        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Steuersatz (%) *</label>
          <select 
            name="tax_rate" 
            value={formData.tax_rate} 
            onChange={handleChange}
            className="block w-full border border-outline rounded-element bg-surface-0 text-foreground py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50 appearance-none bg-no-repeat bg-[right_0.5rem_center]"
            disabled={loading || isReadOnly}
          >
            <option value={19} className="bg-surface-0 text-foreground">19 % (Standard)</option>
            <option value={7} className="bg-surface-0 text-foreground">7 % (Ermäßigt)</option>
            <option value={0} className="bg-surface-0 text-foreground">0 % (Steuerfrei)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
        <div className="relative">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Bestand *</label>
          <div className="relative mt-1">
            <input 
              required 
              type="number" 
              step={getStep(formData.unit)} 
              name="bestand" 
              value={formData.bestand} 
              onChange={handleChange} 
              className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 pl-3 pr-16 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" 
              disabled={loading || isReadOnly}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-foreground/50 text-[11px] font-bold font-mono uppercase pr-1">{formData.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Einheit *</label>
          <div className="grid grid-cols-5 gap-1">
            {ALL_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                disabled={loading || isReadOnly}
                onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                title={u}
                className={`
                  h-9 flex items-center justify-center rounded-element text-[10px] font-mono font-bold uppercase transition-all active:scale-95 border
                  ${formData.unit === u 
                    ? 'bg-primary border-outline text-white dark:text-black dark:font-extrabold shadow-[0_0_10px_rgba(224,108,117,0.2)]' 
                    : 'bg-surface-0 border-outline text-foreground/50 hover:text-foreground hover:bg-surface-2'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 uppercase tracking-widest leading-6 mb-1 ml-1">Mindestbestand *</label>
          <input required type="number" step={getStep(formData.unit)} name="mindestbestand" value={formData.mindestbestand} onChange={handleChange} className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm disabled:opacity-50" disabled={loading || isReadOnly}/>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-outline gap-4">
        <button type="button" onClick={() => router.push('/dashboard/articles')} disabled={loading} className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground hover:bg-surface-2 rounded-element border border-transparent hover:border-outline transition-colors disabled:opacity-50">
          Abbrechen
        </button>
        {isReadOnly ? (
          <div className="text-xs font-bold font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 px-4 py-2 rounded-element border border-amber-500/20">
            Nur Lesezugriff
          </div>
        ) : (
          <button type="submit" disabled={loading} className="px-5 py-2.5 text-xs font-bold text-white dark:text-black dark:font-extrabold bg-primary hover:bg-primary-hover rounded-element border border-outline shadow-sm transition-all disabled:opacity-50 flex items-center font-mono uppercase tracking-widest">
            {loading ? 'Speichere...' : 'Speichern'}
          </button>
        )}
      </div>
    </form>
  );
}
