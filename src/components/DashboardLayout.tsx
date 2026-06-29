import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Building2, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldCheck
} from "lucide-react";
import DbStatusBar from "./DbStatusBar.js";
import { toast } from "./Toast.js";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("Admin");

  useEffect(() => {
    // Read cached admin profile details
    const stored = localStorage.getItem("admin");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.username) {
          setAdminUsername(parsed.username);
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    toast.success("Logged out successfully. Have a nice day!");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Students", path: "/students", icon: Users },
    { name: "Departments", path: "/departments", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Interactive Database Connectivity Bar */}
      <DbStatusBar />

      {/* Main Full-Height Container */}
      <div className="flex-grow flex relative">
        
        {/* 2. Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none tracking-tight">EduManage</h1>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Portal Admin</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-grow p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logged in admin account panel footer */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="bg-slate-800 p-2 rounded-xl text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate leading-none mb-1 capitalize">{adminUsername}</p>
                <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Authorized
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 border border-transparent hover:border-rose-900/30 transition-all active-press"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </aside>

        {/* 3. Mobile Header & Trigger Menu */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight">EduManage</span>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Nav Menu Content */}
            <div className="relative flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-6 z-10 pt-20">
              <nav className="flex-grow space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                          : "hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="bg-slate-800 p-2 rounded-xl text-indigo-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1 capitalize">{adminUsername}</p>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Authorized
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all active-press"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Core Screen Content Frame */}
        <main className="flex-grow p-4 md:p-8 lg:p-10 pt-20 lg:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>

      </div>
    </div>
  );
}
