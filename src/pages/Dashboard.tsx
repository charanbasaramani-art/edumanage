import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Star, 
  Clock, 
  Plus, 
  ArrowRight, 
  GraduationCap, 
  ChevronRight,
  UserCheck
} from "lucide-react";
import API from "../services/api.js";
import { DashboardStats } from "../types.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await API.get("/api/students/stats");
        if (response.data && response.data.success) {
          setStats(response.data.data);
        }
      } catch (error: any) {
        console.error("Failed to load dashboard stats:", error);
        toast.error("Error communicating with server. Check database settings.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <Loader size="lg" text="Loading administrative dashboard..." />;
  }

  // Fallback safe values if stats structure has issues
  const totalStudents = stats?.totalStudents ?? 0;
  const totalDepartments = stats?.totalDepartments ?? 0;
  const avgCgpa = stats?.avgCgpa ?? 0;
  const recentlyAdded = stats?.recentlyAdded ?? [];
  const deptDistribution = stats?.departmentDistribution ?? [];

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Console
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Overview of overall university student enrollment, departments, and metrics.
          </p>
        </div>
        
        {/* Quick action shortcuts */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-colors active-press"
          >
            <Plus className="w-4 h-4" /> Register Student
          </Link>
          <Link
            to="/departments"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors active-press"
          >
            Manage Departments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Numerical Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Students Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-5 hover:border-slate-200 transition-colors">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 leading-none tracking-tight">
              {totalStudents}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Currently enrolled</p>
          </div>
        </div>

        {/* Total Departments Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-5 hover:border-slate-200 transition-colors">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Departments</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 leading-none tracking-tight">
              {totalDepartments}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Academic divisions</p>
          </div>
        </div>

        {/* Average CGPA Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-5 hover:border-slate-200 transition-colors">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <Star className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative Average GPA</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 leading-none tracking-tight">
              {avgCgpa} <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Overall performance average</p>
          </div>
        </div>

      </div>

      {/* 3. Analytics & Details Division */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Side: Department Distribution (3/5 width) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Department Demographics</h4>
              <p className="text-[11px] text-slate-400 font-medium">Distribution of registered student profiles</p>
            </div>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">Live Breakdown</span>
          </div>

          <div className="flex-grow space-y-5">
            {deptDistribution.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <GraduationCap className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No student enrollment data registered yet.</p>
              </div>
            ) : (
              deptDistribution.map((dist, idx) => {
                const percentage = totalStudents > 0 ? Math.round((dist.count / totalStudents) * 100) : 0;
                // Cycle colored bar styles
                const colors = [
                  "bg-indigo-600",
                  "bg-emerald-600",
                  "bg-amber-600",
                  "bg-indigo-500",
                  "bg-rose-500",
                  "bg-sky-500"
                ];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={dist.code} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-700 tracking-wide uppercase">{dist.code} Department</span>
                      <span className="font-bold text-slate-500">
                        {dist.count} {dist.count === 1 ? "student" : "students"} ({percentage}%)
                      </span>
                    </div>
                    {/* Visual Bar Container */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Recently Added Students (2/5 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Enrollments</h4>
                <p className="text-[11px] text-slate-400 font-medium">Recently registered students</p>
              </div>
            </div>
            <Link
              to="/students"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-0.5"
            >
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-grow space-y-4">
            {recentlyAdded.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No recently added students found.</p>
              </div>
            ) : (
              recentlyAdded.map((st) => (
                <div 
                  key={st._id}
                  onClick={() => navigate(`/students/${st._id}`)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group active-press"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={st.photo}
                      alt={st.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="overflow-hidden">
                      <h5 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {st.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {st.rollNo} • {st.department}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-extrabold text-[10px] px-2 py-1 rounded-lg">
                    ★ {st.cgpa.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
