"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const success = (message: string) => toast(message, 'success');
  const error = (message: string) => toast(message, 'error');

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border min-w-[300px] max-w-md
              animate-in slide-in-from-right-full fade-in-0 duration-300
              ${t.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-100 dark:border-green-900/30 text-slate-900 dark:text-white' : ''}
              ${t.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-900 dark:text-red-400' : ''}
              ${t.type === 'info' ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white' : ''}
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${t.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : ''}
              ${t.type === 'error' ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : ''}
              ${t.type === 'info' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : ''}
            `}>
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            
            <div className="flex-grow">
              <p className="text-sm font-black uppercase tracking-tight leading-none mb-1">
                {t.type === 'success' ? 'Erfolg' : t.type === 'error' ? 'Fehler' : 'Hinweis'}
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.message}
              </p>
            </div>

            <button 
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors opacity-40 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
