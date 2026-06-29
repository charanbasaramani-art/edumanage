import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center font-sans">
      <div className="inline-flex items-center justify-center bg-indigo-600 text-white p-4 rounded-3xl shadow-xl shadow-indigo-600/20 mb-6 animate-pulse">
        <GraduationCap className="w-10 h-10" />
      </div>
      
      <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight leading-none">404</h1>
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-4 tracking-tight">Requested Academic Directory Not Found</h2>
      
      <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
        The link or screen you tried to view is either private, removed, or has moved divisions.
      </p>

      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active-press"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
