import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight,
  UserX,
  FilterX,
  Upload,
  Download
} from "lucide-react";
import API from "../services/api.js";
import { Student, Department } from "../types.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";
import ConfirmDialog from "../components/ConfirmDialog.js";

export default function Students() {
  const navigate = useNavigate();

  // Search, Filter, Sort and Pagination state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedSem, setSelectedSem] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Core data states
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Fetch departments list for dropdown
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const response = await API.get("/api/departments");
        if (response.data && response.data.success) {
          setDepartments(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }
    fetchDepartments();
  }, []);

  // Fetch student profiles on parameter updates
  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search,
          department: selectedDept,
          semester: selectedSem,
          gender: selectedGender,
          sortBy,
          sortOrder,
          page: String(page),
          limit: String(limit),
        });

        const response = await API.get(`/api/students?${params.toString()}`);
        if (response.data && response.data.success) {
          setStudents(response.data.data);
          setTotalPages(response.data.pagination.pages);
          setTotalRecords(response.data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
        toast.error("Error reading student list from server");
      } finally {
        setLoading(false);
      }
    }

    // Debounce student searching slightly to avoid overloading requests
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedDept, selectedSem, selectedGender, sortBy, sortOrder, page, limit]);

  // Reset page when search or filter values shift
  const handleFilterChange = (filterType: string, value: string) => {
    setPage(1);
    if (filterType === "dept") setSelectedDept(value);
    if (filterType === "sem") setSelectedSem(value);
    if (filterType === "gender") setSelectedGender(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setSearch(e.target.value);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc on new sort
    }
  };

  // Modal deletion handlers
  const triggerDelete = (st: Student) => {
    setStudentToDelete(st);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!studentToDelete) return;
    try {
      const response = await API.delete(`/api/students/${studentToDelete._id}`);
      if (response.data && response.data.success) {
        toast.success(`Successfully deleted student profile: ${studentToDelete.name}`);
        
        // Re-align pagination page if last row on page is removed
        if (students.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          // Trigger state reload manually
          setSearch((prev) => prev); 
        }
      }
    } catch (error: any) {
      console.error("Student deletion failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete student profile");
    } finally {
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedDept("All");
    setSelectedSem("All");
    setSelectedGender("All");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    toast.info("All search & filters reset");
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        search,
        department: selectedDept,
        semester: selectedSem,
        gender: selectedGender,
        sortBy,
        sortOrder,
        page: "1",
        limit: "100000", // Large limit to fetch all filtered records
      });

      const response = await API.get(`/api/students?${params.toString()}`);
      if (response.data && response.data.success) {
        const filteredStudents: Student[] = response.data.data;
        if (filteredStudents.length === 0) {
          toast.warning("No records match the active search/filters. Nothing to export.");
          return;
        }

        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return "";
          let str = String(val);
          str = str.replace(/"/g, '""');
          if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
            return `"${str}"`;
          }
          return str;
        };

        const headers = [
          "Name", 
          "Roll No", 
          "Reg No", 
          "Email", 
          "Phone", 
          "Gender", 
          "DOB", 
          "Department", 
          "Semester", 
          "Section", 
          "Address", 
          "CGPA", 
          "Skills"
        ];
        
        const csvRows = [
          headers.join(","),
          ...filteredStudents.map(s => [
            escapeCSV(s.name),
            escapeCSV(s.rollNo),
            escapeCSV(s.regNo),
            escapeCSV(s.email),
            escapeCSV(s.phone),
            escapeCSV(s.gender),
            escapeCSV(s.dob ? new Date(s.dob).toISOString().split('T')[0] : ""),
            escapeCSV(s.department),
            escapeCSV(s.semester),
            escapeCSV(s.section),
            escapeCSV(s.address),
            escapeCSV(s.cgpa),
            escapeCSV((s.skills || []).join(", "))
          ].join(","))
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Include filter details in name for clarity
        let filterDesc = "all";
        if (selectedDept !== "All") filterDesc += `_${selectedDept.toLowerCase()}`;
        if (selectedSem !== "All") filterDesc += `_${selectedSem.toLowerCase()}`;
        if (selectedGender !== "All") filterDesc += `_${selectedGender.toLowerCase()}`;
        
        link.setAttribute("download", `edumanage_students_filtered_${filterDesc}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${filteredStudents.length} student records successfully!`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to fetch records for CSV export");
    } finally {
      setExporting(false);
    }
  };

  const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Enrollments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Displaying {totalRecords} total student records in database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting || totalRecords === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:opacity-60 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl shadow-sm transition-all active-press shrink-0"
          >
            <Download className={`w-4 h-4 text-indigo-500 ${exporting ? "animate-spin" : ""}`} /> 
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <Link
            to="/students/import"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl shadow-sm transition-all active-press shrink-0"
          >
            <Upload className="w-4 h-4 text-indigo-500" /> Bulk Import
          </Link>

          <Link
            to="/students/add"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all active-press shrink-0"
          >
            <Plus className="w-5 h-5" /> Register Student
          </Link>
        </div>
      </div>

      {/* Advanced Filter Toolbox */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          
          {/* Dynamic Search Bar */}
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, roll number, registration, email..."
              value={search}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>

          {/* Quick Filters Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Department Selector */}
            <div className="flex flex-col">
              <select
                value={selectedDept}
                onChange={(e) => handleFilterChange("dept", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.code}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Semester Selector */}
            <div className="flex flex-col">
              <select
                value={selectedSem}
                onChange={(e) => handleFilterChange("sem", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              >
                <option value="All">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>{s} Semester</option>
                ))}
              </select>
            </div>

            {/* Gender Selector */}
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <select
                value={selectedGender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(search || selectedDept !== "All" || selectedSem !== "All" || selectedGender !== "All") && (
            <button
              onClick={resetAllFilters}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors shrink-0 active-press"
            >
              Reset Filters
            </button>
          )}

        </div>
      </div>

      {/* Main Student List Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24">
            <Loader size="md" text="Refreshing records..." />
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-4 border border-slate-100">
              <UserX className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Student Records Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
              We couldn't find any student matches for the current filters or query search.
            </p>
            {search || selectedDept !== "All" || selectedSem !== "All" || selectedGender !== "All" ? (
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl border border-indigo-100 transition-all active-press"
              >
                Clear Search Queries
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 tracking-wider uppercase">
                  <th className="px-6 py-4">Student Profile</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort("rollNo")}
                  >
                    Roll / Reg No {sortBy === "rollNo" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort("department")}
                  >
                    Department {sortBy === "department" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th className="px-6 py-4">Sem &amp; Section</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:text-slate-700 transition-colors"
                    onClick={() => toggleSort("cgpa")}
                  >
                    CGPA {sortBy === "cgpa" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
                {students.map((st) => (
                  <tr 
                    key={st._id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Student Identity Card */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.photo}
                          alt={st.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                            {st.name}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{st.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Roll & Reg Nos */}
                    <td className="px-6 py-4.5">
                      <span className="font-semibold text-slate-800 text-xs tracking-wider block">
                        {st.rollNo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {st.regNo}
                      </span>
                    </td>

                    {/* Department Code */}
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                        {st.department}
                      </span>
                    </td>

                    {/* Semester & Section */}
                    <td className="px-6 py-4.5">
                      <div className="text-xs font-semibold text-slate-800">
                        {st.semester} Semester
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        Section {st.section}
                      </div>
                    </td>

                    {/* CGPA Performance Badge */}
                    <td className="px-6 py-4.5">
                      <span 
                        className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg ${
                          st.cgpa >= 9.0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : st.cgpa >= 7.5
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : st.cgpa >= 5.0
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        ★ {st.cgpa.toFixed(2)}
                      </span>
                    </td>

                    {/* Multi-action Buttons */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View profile button */}
                        <button
                          onClick={() => navigate(`/students/${st._id}`)}
                          title="View Profile Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all active-press"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit profile button */}
                        <button
                          onClick={() => navigate(`/students/edit/${st._id}`)}
                          title="Edit Student Information"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-all active-press"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete profile button */}
                        <button
                          onClick={() => triggerDelete(st)}
                          title="Delete Student Record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all active-press"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Navigation footer */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-500">
              Showing page {page} of {totalPages} ({totalRecords} students)
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl transition-all active-press disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl transition-all active-press disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal wrapper */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Student Profile?"
        message={`Are you sure you want to delete the student profile of '${studentToDelete?.name}'? This action cannot be undone and will erase all registered academic history.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDestructive={true}
      />

    </div>
  );
}
