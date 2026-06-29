import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  User, 
  BookOpen, 
  Tag,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import API from "../services/api.js";
import { Student } from "../types.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";
import ConfirmDialog from "../components/ConfirmDialog.js";

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const response = await API.get(`/api/students/${id}`);
        if (response.data && response.data.success) {
          setStudent(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load student profile details:", error);
        toast.error("Requested student profile could not be loaded.");
        navigate("/students", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [id, navigate]);

  const executeDelete = async () => {
    if (!student) return;
    try {
      const response = await API.delete(`/api/students/${student._id}`);
      if (response.data && response.data.success) {
        toast.success(`Deleted student: ${student.name}`);
        navigate("/students");
      }
    } catch (err: any) {
      console.error("Student profile deletion failed:", err);
      toast.error(err.response?.data?.message || "Failed to remove student profile.");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return <Loader size="lg" text="Loading student profile details..." />;
  }

  if (!student) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 shadow-sm rounded-3xl">
        <h3 className="text-lg font-bold text-slate-900">Student Profile Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">The profile is either removed or missing.</p>
        <Link to="/students" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
      </div>
    );
  }

  // Format date elegantly
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-US", options);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-in">
      
      {/* 1. Header controls & Return link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to student records
        </Link>

        {/* Profile specific editing / deleting actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/students/edit/${student._id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 transition-colors active-press"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
          
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-100 transition-colors active-press"
          >
            <Trash2 className="w-4 h-4" /> Delete Record
          </button>
        </div>
      </div>

      {/* 2. Primary Hero Bio Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row items-center md:items-stretch">
        {/* Banner Picture Frame */}
        <div className="w-full md:w-56 shrink-0 bg-slate-900 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100">
          <img
            src={student.photo}
            alt={student.name}
            referrerPolicy="no-referrer"
            className="w-40 h-40 md:w-44 md:h-44 rounded-2xl object-cover border-4 border-white shadow-xl"
          />
        </div>

        {/* Student summary identity */}
        <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {student.department} Student
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none pt-1">
              {student.name}
            </h2>
            <p className="text-sm font-semibold text-slate-400">
              Roll No: <span className="text-slate-700 uppercase tracking-wide">{student.rollNo}</span> • Reg No: <span className="text-slate-700 uppercase tracking-wide">{student.regNo}</span>
            </p>
          </div>

          {/* Quick Metrics display */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-6 mt-6 md:mt-0 text-center md:text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CGPA Grade</span>
              <span className="text-xl font-extrabold text-slate-800 flex items-center justify-center md:justify-start gap-1 mt-0.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" /> {student.cgpa.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Semester</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-0.5">
                {student.semester}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Section</span>
              <span className="text-xl font-extrabold text-slate-800 block mt-0.5 uppercase">
                {student.section}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Parameter Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Personal Details Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900">Personal Information</h3>
          </div>

          <div className="space-y-4">
            {/* Email field */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 truncate block">{student.email}</span>
              </div>
            </div>

            {/* Telephone field */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Number</span>
                <span className="text-sm font-semibold text-slate-800 block">{student.phone}</span>
              </div>
            </div>

            {/* Date of Birth field */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                <span className="text-sm font-semibold text-slate-800 block">{formatDate(student.dob)}</span>
              </div>
            </div>

            {/* Gender identity field */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender Identity</span>
                <span className="text-sm font-semibold text-slate-800 block">{student.gender}</span>
              </div>
            </div>

            {/* Physical address line */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mailing Address</span>
                <span className="text-sm font-semibold text-slate-800 block leading-relaxed">{student.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Academic details & Skills */}
        <div className="space-y-8">
          
          {/* Card A: Academic Program Profile */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900">Academic Standing</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current CGPA Status</span>
                <span className="text-lg font-extrabold text-slate-800 block mt-1">{student.cgpa.toFixed(2)} / 10.0</span>
                <span className="text-[10px] text-indigo-600 font-bold block mt-1 uppercase">Excellent</span>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Admitted Branch</span>
                <span className="text-lg font-extrabold text-slate-800 block mt-1 uppercase">{student.department}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Full-Time enrollment</span>
              </div>
            </div>
          </div>

          {/* Card B: Core Skills tags */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900">Mapped Qualifications</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {!student.skills || student.skills.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium">No custom qualifications or skills registered for this profile.</span>
              ) : (
                student.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-xl uppercase tracking-wider"
                  >
                    <Tag className="w-3.5 h-3.5" /> {skill}
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation modal wrapper */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Permanently Delete Student Profile?"
        message={`Are you sure you want to delete the student profile of '${student.name}'? This action cannot be undone and will erase all registered academic history.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDestructive={true}
      />

    </div>
  );
}
