import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

// Simple event listener pattern to allow calling toast from non-component utility files
type ToastListener = (message: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show(text: string, type: ToastType = "info") {
    const id = Math.random().toString(36).substring(2, 9);
    const message: ToastMessage = { id, text, type };
    listeners.forEach((listener) => listener(message));
  },
  success(text: string) {
    this.show(text, "success");
  },
  error(text: string) {
    this.show(text, "error");
  },
  warning(text: string) {
    this.show(text, "warning");
  },
  info(text: string) {
    this.show(text, "info");
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md animate-slide-in transition-all duration-300 ${
            t.type === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
              : t.type === "error"
              ? "bg-rose-50/95 border-rose-200 text-rose-900"
              : t.type === "warning"
              ? "bg-amber-50/95 border-amber-200 text-amber-900"
              : "bg-slate-50/95 border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {t.type === "error" && <XCircle className="w-5 h-5 text-rose-600" />}
            {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {t.type === "info" && <Info className="w-5 h-5 text-slate-600" />}
          </div>
          
          <div className="flex-grow text-sm font-medium pr-2">
            {t.text}
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
