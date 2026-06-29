import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />

      {/* Dialog box */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 overflow-hidden z-10 animate-slide-in"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div 
            className={`flex-shrink-0 p-3 rounded-xl ${
              isDestructive ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl active-press"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white transition-colors rounded-xl active-press ${
              isDestructive 
                ? "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
