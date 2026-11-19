import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (title: string, tone?: ToastTone, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, tone: ToastTone = 'success', description?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, tone, title, description }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-lg transition-all ${
              toast.tone === 'error'
                ? 'border-red-200 dark:border-red-900 text-red-950 dark:text-red-100'
                : toast.tone === 'info'
                ? 'border-violet-200 dark:border-violet-800 text-slate-900 dark:text-slate-100'
                : 'border-emerald-200 dark:border-emerald-900 text-slate-900 dark:text-slate-100'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            ) : toast.tone === 'info' ? (
              <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
              aria-label="Dismiss notification"
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
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
