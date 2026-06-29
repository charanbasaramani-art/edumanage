import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Users, 
  FileText, 
  FolderLock,
  Building
} from "lucide-react";
import API from "../services/api.js";
import { Department } from "../types.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";
import ConfirmDialog from "../components/ConfirmDialog.js";

export default function Departments() {
  // Core lists states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Add & Edit)
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Fetch departments list
  const fetchDepartments = async () => {
    try {
      const response = await API.get("/api/departments");
      if (response.data && response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load departments:", err);
      toast.error("Error communicating with departments API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddForm = () => {
    setIsEditMode(false);
    setCurrentId("");
    setName("");
    setCode("");
    setDescription("");
    setShowForm(true);
  };

  const openEditForm = (dept: Department) => {
    setIsEditMode(true);
    setCurrentId(dept._id);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setName("");
    setCode("");
    setDescription("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      toast.warning("Please fill in both Department Name and Department Code.");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        // PUT update request
        const response = await API.put(`/api/departments/${currentId}`, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          description: description.trim(),
        });
        if (response.data && response.data.success) {
          toast.success("Department details updated successfully!");
          fetchDepartments();
          closeForm();
        }
      } else {
        // POST create request
        const response = await API.post("/api/departments", {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          description: description.trim(),
        });
        if (response.data && response.data.success) {
          toast.success(`Successfully registered department: ${name.trim()}`);
          fetchDepartments();
          closeForm();
        }
      }
    } catch (error: any) {
      console.error("Failed to save department details:", error);
      toast.error(error.response?.data?.message || "Failed to save department details");
    } finally {
      setSaving(false);
    }
  };

  // Delete flow triggers
  const triggerDelete = (dept: Department) => {
    setDeptToDelete(dept);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deptToDelete) return;
    try {
      const response = await API.delete(`/api/departments/${deptToDelete._id}`);
      if (response.data && response.data.success) {
        toast.success(`Successfully removed department: ${deptToDelete.name}`);
        fetchDepartments();
      }
    } catch (error: any) {
      console.error("Failed to delete department:", error);
      toast.error(error.response?.data?.message || "Failed to delete department");
    } finally {
      setDeleteModalOpen(false);
      setDeptToDelete(null);
    }
  };

  if (loading) {
    return <Loader size="lg" text="Loading departmental structures..." />;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Departments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Displaying {departments.length} total divisions. Configure major fields of study.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all active-press shrink-0"
          >
            <Plus className="w-5 h-5" /> Add Department
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Department Cards List (2/3 width or full) */}
        <div className={`lg:col-span-2 ${showForm ? "" : "lg:col-span-3"} space-y-4`}>
          {departments.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-4 rounded-full text-slate-400 mb-4 border border-slate-100 animate-pulse">
                <Building className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Departments Registered</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
                Click the 'Add Department' button to set up your first university division.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {departments.map((dept) => (
                <div 
                  key={dept._id}
                  className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between h-56 group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                        {dept.code}
                      </span>
                      
                      {/* Interactive edit / delete button panel */}
                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(dept)}
                          title="Edit Details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors active-press"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerDelete(dept)}
                          title="Remove Division"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors active-press"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Meta Bio */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                        {dept.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {dept.description || "No custom curriculum details provided for this branch."}
                      </p>
                    </div>
                  </div>

                  {/* Foot Counter */}
                  <div className="border-t border-slate-50 pt-4 flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <Users className="w-4 h-4 text-slate-300" />
                    <span>
                      <strong className="text-slate-700 font-extrabold">{dept.studentCount ?? 0}</strong> registered students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Inline Side Form panel */}
        {showForm && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-6 animate-slide-in shrink-0">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900">
                  {isEditMode ? "Modify Division Details" : "Register Department"}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all active-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Department Name input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department Division Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science &amp; Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Department Code input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium uppercase"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1.5 leading-normal">
                  Short unique key used to map students (e.g. CSE, ECE, ME).
                </span>
              </div>

              {/* Department Description input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Curriculum Description
                </label>
                <textarea
                  placeholder="Curriculum focus, program specifics..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-grow px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl active-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-grow inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-colors active-press disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : isEditMode ? "Save Details" : "Create division"}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* Confirmation modal wrapper */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Permanently Remove Department?"
        message={`Are you sure you want to remove the department '${deptToDelete?.name}' (${deptToDelete?.code})? This will fail if student enrollments are currently mapped to this division.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDestructive={true}
      />

    </div>
  );
}
