"use client";

import { useState } from 'react';
import { PackageOpen, Plus, Minus, RotateCcw, Loader2, Check } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface StockAdjustmentFormProps {
  onAdjust: (amount: number, type: 'input' | 'output') => Promise<void>;
  loading: boolean;
}

export function StockAdjustmentForm({ onAdjust, loading }: StockAdjustmentFormProps) {
  const [amount, setAmount] = useState<number>(1);
  const [type, setType] = useState<'input' | 'output'>('input');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  // Clear messages after delay
  useEffect(() => {
    if (showSuccess || error) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, error]);

  const handleButtonClick = async () => {
    if (loading || showSuccess) return;
    
    // Validation
    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      setError("Bitte eine gültige Menge eingeben.");
      return;
    }

    const finalAmount = type === 'output' ? -Math.abs(amount) : amount;
    try {
      setError(null);
      await onAdjust(finalAmount, type);
      setShowSuccess(true);
      toastSuccess(`Lagerbuchung (${type === 'input' ? '+' : '-'}${amount}) erfolgreich ausgeführt.`);
    } catch (err: any) {
      setError(err.message || "Buchung fehlgeschlagen");
      toastError(err.message || "Buchung fehlgeschlagen");
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PackageOpen className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Bestand anpassen</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 gap-1">
          <button
            type="button"
            onClick={() => { setType('input'); setShowSuccess(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              type === 'input' 
              ? 'bg-green-100 text-green-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Einlagerung
          </button>
          <button
            type="button"
            onClick={() => { setType('output'); setShowSuccess(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
              type === 'output' 
              ? 'bg-red-100 text-red-700 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            Entnahme
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Menge</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)); setShowSuccess(false); }}
            className="block w-full rounded-lg border-0 py-2.5 px-3 text-slate-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            required
          />
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            showSuccess 
            ? 'bg-green-600 text-white animate-pulse' 
            : error
            ? 'bg-red-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird gebucht...
            </>
          ) : showSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Erfolgreich gebucht!
            </>
          ) : error ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Fehler (Nochmal?)
            </>
          ) : (
            'Lagerbuchung ausführen'
          )}
        </button>

        {error && (
          <p className="text-[10px] text-red-600 dark:text-red-400 font-bold text-center mt-2 animate-bounce">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
