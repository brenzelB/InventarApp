"use client";

import { useState, useEffect, useRef } from 'react';
import { PackageOpen, Plus, Minus, RotateCcw, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface StockAdjustmentFormProps {
  onAdjust: (amount: number, type: 'input' | 'output') => Promise<void>;
  loading: boolean;
}

export function StockAdjustmentForm({ onAdjust, loading }: StockAdjustmentFormProps) {
  const [amount, setAmount] = useState<number>(1);
  const [type, setType] = useState<'input' | 'output'>('input');
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the quantity input on initial mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Clear errors after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleButtonClick = async () => {
    // Validation
    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      setError("Bitte eine gültige Menge eingeben.");
      inputRef.current?.focus();
      return;
    }

    const finalAmount = type === 'output' ? -Math.abs(amount) : amount;
    try {
      setError(null);
      // Trigger stock adjustment (runs as optimistic update in background)
      await onAdjust(finalAmount, type);
      
      // Fast, 1-second toast notification
      toastSuccess(`Lagerbuchung (${type === 'input' ? '+' : '-'}${amount}) erfolgreich ausgeführt.`, 1000);
      
      // Reset input amount to default and immediately focus/select it for the next scan
      setAmount(1);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } catch (err: any) {
      setError(err.message || "Buchung fehlgeschlagen");
      toastError(err.message || "Buchung fehlgeschlagen", 2000);
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleButtonClick();
    }
  };

  return (
    <div className="bg-widget p-5 rounded-card border border-outline shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <PackageOpen className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground text-xs uppercase font-mono tracking-wider">[ STOCK_EDIT ] Bestand anpassen</h3>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 bg-surface-2 p-1 rounded-element border border-outline gap-1">
          <button
            type="button"
            onClick={() => { setType('input'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-element text-xs font-bold transition-all uppercase font-mono tracking-wider ${
              type === 'input' 
              ? 'bg-secondary/15 text-secondary border border-secondary/25 shadow-sm' 
              : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Einlagerung
          </button>
          <button
            type="button"
            onClick={() => { setType('output'); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-element text-xs font-bold transition-all uppercase font-mono tracking-wider ${
              type === 'output' 
              ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm' 
              : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            Entnahme
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold font-mono text-foreground/50 mb-1.5 uppercase tracking-widest ml-1">Menge</label>
          <input
            ref={inputRef}
            type="number"
            step="any"
            min="0.01"
            value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)); }}
            onKeyDown={handleKeyDown}
            className="block w-full border border-outline rounded-element bg-surface-0 text-foreground placeholder-foreground/30 py-2 px-3 focus:ring-1 focus:ring-primary focus:border-primary text-xs font-mono font-bold transition-all shadow-sm"
            required
          />
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          className="w-full py-3 rounded-element text-xs font-bold font-mono uppercase tracking-widest shadow-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover border-outline text-white dark:text-black dark:font-extrabold"
        >
          {error ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Fehler (Nochmal?)
            </>
          ) : (
            'Lagerbuchung ausführen'
          )}
        </button>

        {error && (
          <p className="text-[10px] text-primary font-bold text-center mt-2 animate-bounce uppercase font-mono">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

