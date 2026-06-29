import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, ShieldAlert, KeyRound, User, ChevronRight, Globe, Settings, Check, RefreshCw } from "lucide-react";
import API from "../services/api.js";
import { toast } from "../components/Toast.js";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Custom states for external hosting support (e.g. Netlify)
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem("override_api_url") || "");
  const [showConfig, setShowConfig] = useState(false);

  const isExternalDeploy = !window.location.hostname.includes("localhost") && 
                           !window.location.hostname.includes("127.0.0.1") && 
                           !window.location.hostname.endsWith(".run.app");

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = backendUrl.trim();
    if (cleanUrl) {
      // Add https protocol if missing
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = "https://" + cleanUrl;
      }
      // Remove trailing slash
      cleanUrl = cleanUrl.replace(/\/$/, "");
      
      localStorage.setItem("override_api_url", cleanUrl);
      setBackendUrl(cleanUrl);
      toast.success("Backend URL updated successfully!");
    } else {
      localStorage.removeItem("override_api_url");
      setBackendUrl("");
      toast.info("Cleared custom backend URL. Using standard relative fallback.");
    }
    setShowConfig(false);
  };

  useEffect(() => {
    // If user is already authenticated, skip login
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }

    // Check if session expired
    if (searchParams.get("expired") === "true") {
      toast.warning("Your admin session has expired. Please log in again.");
    }
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await API.post("/api/auth/login", {
        username: username.trim(),
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        
        toast.success(`Welcome back, ${response.data.admin.username}! Login successful.`);
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Login failure:", error);
      let message = error.response?.data?.message;
      
      if (!message) {
        if (isExternalDeploy) {
          message = "Network Connection Failed. Because this app is running on Netlify, your browser is blocking requests to the Cloud Run Preview URL due to Google Cloud's preview security constraints (CORS & Proxy Authentication). To bypass this, we recommend clicking on the 'Development App URL' or 'Shared App URL' directly in AI Studio to use the co-located full-stack experience, or connect this Netlify app to a public backend on Render/Railway.";
        } else {
          message = "Server connection lost. Please ensure the server is running on port 3000 and try again.";
        }
      }
      setErrorMsg(message);
      toast.error("Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPrefill = () => {
    setUsername("admin");
    setPassword("admin123");
    setErrorMsg("");
    toast.info("Demo credentials loaded!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Rounded Launcher Logo Accent */}
        <div className="inline-flex items-center justify-center bg-indigo-600 text-white p-3.5 rounded-2xl shadow-xl shadow-indigo-600/20 mb-4 animate-slide-in">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to EduManage
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
          MERN Student Management &amp; Information Administration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-in" style={{ animationDelay: "100ms" }}>
        <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-100 rounded-3xl border border-slate-100 sm:px-10">
          
          {/* External Deploy API Setup Banner */}
          {isExternalDeploy && (
            <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Cloud Run Connected
                  </h4>
                  <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
                    This frontend has automatically linked to your live Cloud Run backend API!
                  </p>
                  
                  {!showConfig ? (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-emerald-600 truncate max-w-[150px]">
                        API: {localStorage.getItem("override_api_url") || "Auto-detected Cloud Run"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowConfig(true)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5" /> Override URL
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveConfig} className="mt-3 space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                          Cloud Run Backend API URL
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="https://your-cloudrun-url.run.app"
                          value={backendUrl}
                          onChange={(e) => setBackendUrl(e.target.value)}
                          className="block w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs font-medium"
                        />
                      </div>
                      
                      <div className="bg-emerald-100/50 p-2 rounded-lg text-[10px] text-emerald-800 font-medium">
                        <span className="font-bold text-emerald-900 block mb-0.5">Your Cloud Run Service URL:</span>
                        <code className="block bg-white/80 p-1 rounded border border-emerald-100 select-all font-mono break-all text-[9px]">
                          https://ais-pre-qy2vqkrtdehdnxdbr2zucd-944828103572.asia-southeast1.run.app
                        </code>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBackendUrl(localStorage.getItem("override_api_url") || "");
                            setShowConfig(false);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-800 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">Authentication Failed</span>
                <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Admin Username
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/10 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active-press disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? "Verifying..." : "Access Administrator Panel"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Beginner prefill shortcut */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400 font-medium block mb-3">Beginner Quick Demo Shortcut:</span>
            <button
              onClick={handleDemoPrefill}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-100 transition-colors active-press"
            >
              Prefill Demo Credentials (admin / admin123)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
