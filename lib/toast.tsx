'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, X, Plane } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    const timer = setTimeout(() => dismiss(id), 3500);
    timers.current.set(id, timer);
  }, [dismiss]);

  useEffect(() => {
    return () => { timers.current.forEach((t) => clearTimeout(t)); };
  }, []);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-6 h-6 text-red-400 shrink-0" />,
    info: <Info className="w-6 h-6 text-blue-400 shrink-0" />,
  };

  const styleMap: Record<ToastType, string> = {
    success: 'border-emerald-500/40 shadow-emerald-500/20',
    error: 'border-red-500/40 shadow-red-500/20',
    info: 'border-blue-500/40 shadow-blue-500/20',
  };

  const glowMap: Record<ToastType, string> = {
    success: 'from-emerald-500/15 via-transparent to-transparent',
    error: 'from-red-500/15 via-transparent to-transparent',
    info: 'from-blue-500/15 via-transparent to-transparent',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#12141C]/95 backdrop-blur-xl border shadow-2xl animate-toast-pop min-w-[290px] max-w-[420px] ${styleMap[t.type]}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${glowMap[t.type]} pointer-events-none`} />
            {t.type === 'success' && (
              <Plane className="absolute w-5 h-5 text-emerald-300/70 animate-toast-plane pointer-events-none" style={{ top: '14px' }} aria-hidden="true" />
            )}
            {iconMap[t.type]}
            <span className="relative text-sm text-white/90 flex-1 font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="relative text-white/30 hover:text-white/70 hover:scale-125 transition-all duration-200 shrink-0">
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
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
