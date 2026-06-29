import React, { useState, useEffect } from "react";
import { Database, Wifi, AlertTriangle, Settings, X, Check, RefreshCw } from "lucide-react";
import API from "../services/api.js";
import { DbStatus } from "../types.js";
import { toast } from "./Toast.js";

export default function DbStatusBar() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uriInput, setUriInput] = useState("");
  const [testing, setTesting] = useState(false);

  async function fetchDbStatus() {
    try {
      const response = await API.get("/api/db-status");
      if (response.data) {
        setDbStatus({
          connected: response.data.connected,
          mode: response.data.mode,
          tip: response.data.tip,
        });
      }
    } catch (error) {
      console.error("Failed to query DB connection status:", error);
    }
  }

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleOpenConfig = () => {
    // Attempt to load current or default value
    const savedUri = localStorage.getItem("last_attempted_mongodb_uri") || "";
    setUriInput(savedUri);
    setIsOpen(true);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const uri = uriInput.trim();
    if (!uri) {
      toast.error("Please enter a valid MongoDB connection string.");
      return;
    }

    setTesting(true);
    try {
      const response = await API.post("/api/db-status/configure", { uri });
      if (response.data && response.data.success) {
        toast.success(response.data.message || "Database connected successfully!");
        localStorage.setItem("last_attempted_mongodb_uri", uri);
        setIsOpen(false);
        // Refresh connection state
        await fetchDbStatus();
      }
    } catch (error: any) {
      console.error("Database connection failure:", error);
      const msg = error.response?.data?.message || "Connection failed. Please check the network or credentials.";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  if (!dbStatus) return null;

  return (
    <>
      <div 
        className={`border-b text-xs font-medium px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors ${
          dbStatus.connected
            ? "bg-indigo-50/50 border-indigo-100 text-indigo-900"
            : "bg-amber-50/50 border-amber-100 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${dbStatus.connected ? "text-indigo-600 animate-pulse" : "text-amber-600"}`} />
          <span>
            <span className="font-bold">Database Engine:</span> {dbStatus.mode}
          </span>
          <button
            type="button"
            onClick={handleOpenConfig}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              dbStatus.connected
                ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
                : "bg-amber-100 hover:bg-amber-200 text-amber-800"
            }`}
          >
            <Settings className="w-3 h-3" /> Configure DB
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-500 max-w-lg md:text-right">
          {dbStatus.connected ? (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Wifi className="w-3.5 h-3.5" /> Persistent Cloud Sync Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {dbStatus.tip}
            </span>
          )}
        </div>
      </div>

      {/* Database Connection Config Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
              onClick={() => !testing && setIsOpen(false)}
            ></div>

            {/* Centering helper */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Content Card */}
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100 animate-slide-in">
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-extrabold tracking-tight">Database Settings</h3>
                </div>
                {!testing && (
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={handleConnect} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Connection Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className={`p-3 rounded-xl border text-center ${dbStatus.connected ? "border-indigo-200 bg-indigo-50/30 text-indigo-900 font-bold" : "border-slate-200 bg-slate-50/50 text-slate-400"}`}>
                      <div className="text-xs">MongoDB Cloud</div>
                      <div className="text-[10px] font-medium opacity-80 mt-0.5">Active on Cloud</div>
                    </div>
                    <div className={`p-3 rounded-xl border text-center ${!dbStatus.connected ? "border-amber-200 bg-amber-50/30 text-amber-900 font-bold" : "border-slate-200 bg-slate-50/50 text-slate-400"}`}>
                      <div className="text-xs">In-Memory Sandboxed</div>
                      <div className="text-[10px] font-medium opacity-80 mt-0.5">Active Locally</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mongodb-uri" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    MongoDB Atlas Connection URI
                  </label>
                  <textarea
                    id="mongodb-uri"
                    rows={3}
                    required
                    disabled={testing}
                    placeholder="mongodb+srv://acharansvision26_db_user:<password>@cluster0.mhab328.mongodb.net/student_db?appName=Cluster0"
                    value={uriInput}
                    onChange={(e) => setUriInput(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-mono"
                  />
                </div>

                {/* Helpful guides & setup hints */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900 block">💡 Setup Guide for submission:</span>
                  <ul className="list-decimal pl-4 space-y-1">
                    <li>Copy your connection URI from MongoDB Atlas.</li>
                    <li>Be sure to replace <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">&lt;password&gt;</code> with your real database user password.</li>
                    <li>Specify a database name (e.g. <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">/student_db</code> or <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">/test</code>) before the question mark.</li>
                    <li>Paste and click <strong>Test &amp; Connect</strong>! The server will persist it immediately in <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">.env</code>.</li>
                  </ul>
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Test &amp; Connect
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
