import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, X, GraduationCap, RefreshCw } from "lucide-react";
import API from "../services/api.js";
import { Department, Student } from "../types.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";

// Beautiful default student avatar presets so they can select
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=256",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256",
];

export default function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Loaders
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Core choices state
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [semester, setSemester] = useState("1st");
  const [section, setSection] = useState("A");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(AVATAR_PRESETS[0]);
  const [cgpa, setCgpa] = useState("");

  // Skills tags collections
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // 1. Load departments list AND active student record
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch departments
        const deptsResponse = await API.get("/api/departments");
        let deptsList: Department[] = [];
        if (deptsResponse.data && deptsResponse.data.success) {
          deptsList = deptsResponse.data.data;
          setDepartments(deptsList);
        }

        // Fetch student details
        const studentResponse = await API.get(`/api/students/${id}`);
        if (studentResponse.data && studentResponse.data.success) {
          const student: Student = studentResponse.data.data;
          
          // Pre-fill states
          setName(student.name);
          setRollNo(student.rollNo);
          setRegNo(student.regNo);
          setEmail(student.email);
          setPhone(student.phone);
          setGender(student.gender);
          setAddress(student.address);
          setPhoto(student.photo);
          setCgpa(String(student.cgpa));
          setSemester(student.semester);
          setSection(student.section);
          setSkills(student.skills || []);

          // Slice date string correctly for date picker (YYYY-MM-DD)
          if (student.dob) {
            const dateObj = new Date(student.dob);
            if (!isNaN(dateObj.getTime())) {
              setDob(dateObj.toISOString().split("T")[0]);
            }
          }

          // Preset department matching code
          const matchesDept = deptsList.some(d => d.code === student.department);
          if (matchesDept) {
            setSelectedDept(student.department);
          } else if (deptsList.length > 0) {
            setSelectedDept(deptsList[0].code);
          }
        }
      } catch (err: any) {
        console.error("Failed to load edit student dependencies:", err);
        toast.error("Requested student profile not found on the server.");
        navigate("/students", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, navigate]);

  // Skill management functions
  const addSkill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const clean = currentSkillInput.trim();
    if (clean && !skills.includes(clean)) {
      setSkills((prev) => [...prev, clean]);
      setCurrentSkillInput("");
    }
  };

  const removeSkill = (tag: string) => {
    setSkills((prev) => prev.filter((s) => s !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!name.trim() || !rollNo.trim() || !regNo.trim() || !email.trim() || !phone.trim() || !dob || !selectedDept || !address.trim() || !cgpa) {
      toast.warning("Please fill in all required student registration details.");
      return;
    }

    const numericCgpa = parseFloat(cgpa);
    if (isNaN(numericCgpa) || numericCgpa < 0 || numericCgpa > 10) {
      toast.warning("CGPA must be a valid decimal number between 0.00 and 10.00");
      return;
    }

    setSaving(true);

    try {
      const response = await API.put(`/api/students/${id}`, {
        name: name.trim(),
        rollNo: rollNo.toUpperCase().trim(),
        regNo: regNo.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        gender,
        dob,
        department: selectedDept,
        semester,
        section: section.trim().toUpperCase(),
        address: address.trim(),
        photo,
        cgpa: numericCgpa,
        skills,
      });

      if (response.data && response.data.success) {
        toast.success(`Successfully saved student profile: ${name.trim()}`);
        navigate("/students");
      }
    } catch (error: any) {
      console.error("Failed to update student profile:", error);
      const msg = error.response?.data?.message || "Connection timeout. Please verify parameters and try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader size="md" text="Loading student record details..." />;
  }

  const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in">
      
      {/* Top Breadcrumb Nav Bar */}
      <div className="flex items-center gap-3">
        <Link
          to="/students"
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl transition-colors active-press shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Registry</span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-none">Modify Student Profile</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Visual Photo Selection Grid section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight block mb-3">
              1. Student Profile Photo
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              {/* Active Selection Large Frame */}
              <div className="relative shrink-0">
                <img
                  src={photo}
                  alt="Active profile choice"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md shadow-indigo-600/10"
                />
                <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                  Choice
                </span>
              </div>

              {/* Grid of Avatars selection presets */}
              <div className="flex-grow space-y-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Modify profile avatar option:</span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPhoto(preset)}
                      className={`w-10 h-10 rounded-xl overflow-hidden transition-all border-2 active-press ${
                        photo === preset ? "border-indigo-600 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preset} alt={`Preset ${index + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Core Identity Information section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight block border-b border-slate-50 pb-2">
              2. Academic &amp; Personal Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full name input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Email address input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Academic Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice.j@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Roll Number input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS23101"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium uppercase"
                />
              </div>

              {/* Registration Number input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REG2023CS001"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium uppercase"
                />
              </div>

              {/* Telephone Contact input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1-555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Gender Select dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Gender Identity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date of Birth input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Date Of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>

              {/* Address Line input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Postal Mailing Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Academic Dr, Building 4B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Academic Division Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight block border-b border-slate-50 pb-2">
              3. Academic Course &amp; Department Allocation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {/* Department drop down selection */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Academic Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester dropdown select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                >
                  {semesters.map((s) => (
                    <option key={s} value={s}>{s} Semester</option>
                  ))}
                </select>
              </div>

              {/* Section input selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Section <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A"
                  maxLength={2}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium uppercase"
                />
              </div>

              {/* CGPA Performance input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  CGPA Grade <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  placeholder="e.g. 9.15"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Skills Tagging System section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight block border-b border-slate-50 pb-2">
              4. Student Core Skills &amp; Qualifications
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Core Skills (Press Enter or Comma to add tags)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. React, Python, UI Design"
                  value={currentSkillInput}
                  onChange={(e) => setCurrentSkillInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block flex-grow px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => addSkill()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors active-press flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Rendered Tags Collection */}
              <div className="flex flex-wrap gap-2 mt-3.5">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-400 font-medium">No skills mapped yet. Add some qualifications!</span>
                ) : (
                  skills.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-slate-200 hover:border-slate-300 transition-all"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeSkill(tag)}
                        className="text-slate-400 hover:text-slate-600 rounded-md p-0.5 hover:bg-black/5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Form Save Action footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate("/students")}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors rounded-xl active-press disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/10 transition-colors active-press disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} /> {saving ? "Saving Changes..." : "Save Student Changes"}
          </button>
        </div>

      </form>

    </div>
  );
}
