'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Container - RTL aligned top-left */}
      <div
        className="fixed top-5 left-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
              border: 'border-emerald-200',
              bg: 'bg-emerald-50/95',
              titleColor: 'text-emerald-950',
              msgColor: 'text-emerald-800',
              accent: 'bg-emerald-500',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
              border: 'border-rose-200',
              bg: 'bg-rose-50/95',
              titleColor: 'text-rose-950',
              msgColor: 'text-rose-800',
              accent: 'bg-rose-500',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
              border: 'border-amber-200',
              bg: 'bg-amber-50/95',
              titleColor: 'text-amber-950',
              msgColor: 'text-amber-800',
              accent: 'bg-amber-500',
            },
            info: {
              icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
              border: 'border-sky-200',
              bg: 'bg-sky-50/95',
              titleColor: 'text-sky-950',
              msgColor: 'text-sky-800',
              accent: 'bg-sky-500',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${typeConfig.border} ${typeConfig.bg} backdrop-blur-md shadow-lg transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-4`}
              dir="rtl"
            >
              <div className="mt-0.5">{typeConfig.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${typeConfig.titleColor}`}>{toast.title}</p>
                {toast.message && (
                  <p className={`text-xs mt-1 leading-relaxed ${typeConfig.msgColor}`}>
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors shrink-0"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
