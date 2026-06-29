import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  HelpCircle,
  Clipboard,
  Check,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import API from "../services/api.js";
import { toast } from "../components/Toast.js";
import Loader from "../components/Loader.js";

// synonyms mapping to automatically match headers in CSV in any order
const HEADER_SYNONYMS: { [key: string]: string } = {
  name: "name",
  "student name": "name",
  "full name": "name",
  rollno: "rollNo",
  roll: "rollNo",
  "roll number": "rollNo",
  regno: "regNo",
  reg: "regNo",
  "registration number": "regNo",
  registration: "regNo",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  "mobile number": "phone",
  gender: "gender",
  sex: "gender",
  dob: "dob",
  "date of birth": "dob",
  birthdate: "dob",
  department: "department",
  dept: "department",
  semester: "semester",
  sem: "semester",
  section: "section",
  address: "address",
  location: "address",
  cgpa: "cgpa",
  gpa: "cgpa",
  skills: "skills",
  skill: "skills",
  talents: "skills"
};

interface ParsedRecord {
  index: number;
  data: any;
  isValid: boolean;
  errors: string[];
}

export default function ImportStudents() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successImport, setSuccessImport] = useState<{ imported: number; failed: number } | null>(null);

  // Parse state
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [copied, setCopied] = useState(false);

  // Sample CSV data for user copy/paste and template download
  const csvTemplateHeader = "name,rollNo,regNo,email,phone,gender,dob,department,semester,section,address,cgpa,skills";
  const csvTemplateRows = [
    'John Doe,CSE001,REG2026001,john.doe@example.com,9876543210,Male,2004-05-15,CSE,3rd,A,"123 Campus Lane, Tech City",8.75,"React, Python, Git"',
    'Jane Smith,ECE042,REG2026042,jane.smith@example.com,9123456789,Female,2005-01-20,ECE,1st,B,"456 Hostel Block B",9.10,"MATLAB, Circuits"',
    'Alex Rivera,ME105,REG2026105,alex.rivera@example.com,9345678912,Other,2003-11-08,ME,5th,C,"789 University Apartments",6.80,"CAD, SolidWorks"'
  ];
  const fullTemplateText = `${csvTemplateHeader}\n${csvTemplateRows.join("\n")}`;

  // Download template as file
  const handleDownloadTemplate = () => {
    const blob = new Blob([fullTemplateText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "edumanage_student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV import template downloaded!");
  };

  // Copy sample text to clipboard
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(fullTemplateText);
    setCopied(true);
    toast.info("Sample CSV template copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parse CSV text natively
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        row.push(cell.trim());
        cell = "";

        if (row.length > 0 && row.some((c) => c !== "")) {
          result.push(row);
        }
        row = [];
        if (char === "\r" && next === "\n") {
          i++; // Skip the newline part of CRLF
        }
      } else {
        cell += char;
      }
    }

    if (cell !== "" || row.length > 0) {
      row.push(cell.trim());
      if (row.some((c) => c !== "")) {
        result.push(row);
      }
    }

    return result;
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid spreadsheet file with .csv extension");
      return;
    }

    setFileName(file.name);
    // Format file size
    const sizeInKB = file.size / 1024;
    setFileSize(sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB.toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Failed to read the content of the CSV file");
        return;
      }

      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast.error("The CSV file is empty or missing data records. Must contain a header row and at least 1 record.");
        return;
      }

      // First row: headers
      const rawHeaders = rows[0].map((h) => h.toLowerCase().trim());
      const mappedHeaderIndexes: { [key: string]: number } = {};

      // Match headers against synonyms
      rawHeaders.forEach((header, index) => {
        const canonicalKey = HEADER_SYNONYMS[header];
        if (canonicalKey) {
          mappedHeaderIndexes[canonicalKey] = index;
        }
      });

      // Verify essential headers
      const essentialFields = [
        "name",
        "rollNo",
        "regNo",
        "email",
        "phone",
        "gender",
        "dob",
        "department",
        "semester",
        "section",
        "address",
        "cgpa"
      ];
      const missingFields = essentialFields.filter((field) => mappedHeaderIndexes[field] === undefined);

      if (missingFields.length > 0) {
        toast.error(`CSV lacks standard headers: ${missingFields.join(", ")}. Please use our template.`);
        return;
      }

      // Check for duplicate tracking in the CSV itself
      const seenRolls = new Set<string>();
      const seenRegs = new Set<string>();
      const seenEmails = new Set<string>();

      // Read student lines
      const parsedRecords: ParsedRecord[] = [];
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (rowData.length === 0 || rowData.every(c => c === "")) continue;

        // Extract student fields from mapped indexes
        const student: any = {};
        essentialFields.forEach((field) => {
          const idx = mappedHeaderIndexes[field];
          student[field] = rowData[idx] !== undefined ? rowData[idx].trim() : "";
        });

        // Parse skills separately
        if (mappedHeaderIndexes["skills"] !== undefined) {
          const rawSkills = rowData[mappedHeaderIndexes["skills"]];
          student.skills = rawSkills
            ? rawSkills
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s !== "")
            : [];
        } else {
          student.skills = [];
        }

        // Run validation
        const errors: string[] = [];

        // Required field assertions
        if (!student.name) errors.push("Student name is required");
        if (!student.rollNo) errors.push("Roll number is required");
        if (!student.regNo) errors.push("Registration number is required");
        if (!student.email) errors.push("Email address is required");
        if (!student.phone) errors.push("Phone number is required");
        if (!student.gender) errors.push("Gender field is required");
        if (!student.dob) errors.push("Date of birth is required");
        if (!student.department) errors.push("Department is required");
        if (!student.semester) errors.push("Semester is required");
        if (!student.section) errors.push("Section is required");
        if (!student.address) errors.push("Full address is required");
        if (student.cgpa === "") errors.push("CGPA score is required");

        // Format and bounds validation
        if (student.email && !emailRegex.test(student.email)) {
          errors.push(`Invalid email format: '${student.email}'`);
        }

        // Gender capitalization/normalizing
        if (student.gender) {
          const lowerGen = student.gender.toLowerCase();
          if (lowerGen === "male") student.gender = "Male";
          else if (lowerGen === "female") student.gender = "Female";
          else if (lowerGen === "other") student.gender = "Other";
          else {
            errors.push(`Invalid gender '${student.gender}'. Must be 'Male', 'Female', or 'Other'`);
          }
        }

        // DOB Check
        if (student.dob) {
          const timestamp = Date.parse(student.dob);
          if (isNaN(timestamp)) {
            errors.push(`Invalid date of birth format: '${student.dob}'. Use YYYY-MM-DD.`);
          } else {
            // Format to ISO date string (YYYY-MM-DD)
            student.dob = new Date(timestamp).toISOString().split("T")[0];
          }
        }

        // CGPA check
        if (student.cgpa !== "") {
          const numCgpa = parseFloat(student.cgpa);
          if (isNaN(numCgpa)) {
            errors.push(`CGPA must be a numeric score: '${student.cgpa}'`);
          } else if (numCgpa < 0 || numCgpa > 10) {
            errors.push("CGPA score must range strictly between 0.0 and 10.0");
          } else {
            student.cgpa = numCgpa;
          }
        }

        // CSV uniqueness checks
        if (student.rollNo) {
          const rollUpper = student.rollNo.toUpperCase();
          if (seenRolls.has(rollUpper)) {
            errors.push(`Duplicate Roll Number '${rollUpper}' within the CSV file`);
          } else {
            seenRolls.add(rollUpper);
          }
        }

        if (student.regNo) {
          const regUpper = student.regNo.toUpperCase();
          if (seenRegs.has(regUpper)) {
            errors.push(`Duplicate Registration Number '${regUpper}' within the CSV file`);
          } else {
            seenRegs.add(regUpper);
          }
        }

        if (student.email) {
          const mailLower = student.email.toLowerCase();
          if (seenEmails.has(mailLower)) {
            errors.push(`Duplicate Email Address '${mailLower}' within the CSV file`);
          } else {
            seenEmails.add(mailLower);
          }
        }

        parsedRecords.push({
          index: i,
          data: student,
          isValid: errors.length === 0,
          errors
        });
      }

      setRecords(parsedRecords);
      toast.success(`Successfully parsed ${parsedRecords.length} lines from CSV!`);
    };

    reader.onerror = () => {
      toast.error("Error reading file");
    };

    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setFileName("");
    setFileSize("");
    setRecords([]);
    setSuccessImport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const executeBulkImport = async () => {
    const validRecords = records.filter((r) => r.isValid).map((r) => r.data);
    
    if (validRecords.length === 0) {
      toast.error("There are no valid records to import. Please check your formatting errors.");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/api/students/bulk-import", {
        students: validRecords
      });

      if (response.data && response.data.success) {
        const importedCount = response.data.importedCount;
        const failedCount = response.data.failedCount;
        const backendErrors = response.data.errors || [];

        setSuccessImport({
          imported: importedCount,
          failed: failedCount
        });

        // If there were backend-specific database validation failures (e.g., unique index violations)
        if (backendErrors.length > 0) {
          toast.warning(`Import complete. ${importedCount} added, but ${failedCount} failed due to database duplicate conflicts.`);
          
          // Map backend failures back into our visual records so the admin can inspect them!
          const updatedRecords = records.map((record) => {
            const backendMatch = backendErrors.find(
              (err: any) =>
                (err.rollNo && err.rollNo === record.data.rollNo?.toUpperCase()) ||
                (err.email && err.email === record.data.email?.toLowerCase())
            );
            if (backendMatch) {
              return {
                ...record,
                isValid: false,
                errors: [...record.errors, backendMatch.reason]
              };
            }
            return record;
          });
          setRecords(updatedRecords);
        } else {
          toast.success(`Successfully registered all ${importedCount} student profiles!`);
          setTimeout(() => {
            navigate("/students");
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      toast.error(err.response?.data?.message || "Internal server error during bulk record import");
    } finally {
      setLoading(false);
    }
  };

  const totalCount = records.length;
  const validCount = records.filter((r) => r.isValid).length;
  const invalidCount = totalCount - validCount;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/students"
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl transition-all active-press"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Admin Operations
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bulk Student Import
          </h2>
        </div>
      </div>

      {successImport ? (
        /* SUCCESS REPORT BLOCK */
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6 text-center max-w-2xl mx-auto">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100 mb-2">
            <CheckCircle2 className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Bulk Enrollment Processing Finished</h3>
            <p className="text-sm text-slate-500 mt-2">
              The spreadsheet import task completed. Below are the execution metrics:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
              <span className="text-2xl font-black text-emerald-700 block">
                {successImport.imported}
              </span>
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase block mt-1">
                Imported Profiles
              </span>
            </div>
            <div className={`rounded-2xl p-4 border ${successImport.failed > 0 ? "bg-rose-50/50 border-rose-100 text-rose-700" : "bg-slate-50/50 border-slate-100 text-slate-500"}`}>
              <span className="text-2xl font-black block">
                {successImport.failed}
              </span>
              <span className="text-xs font-bold tracking-wider uppercase block mt-1">
                Failed/Conflicts
              </span>
            </div>
          </div>

          {successImport.failed > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-left text-xs text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Important Notice:</span> {successImport.failed} student records could not be registered because their emails, roll numbers, or registration numbers are already active on this platform's database. The conflicting records are highlighted below.
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRemoveFile}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all active-press"
            >
              Upload Another File
            </button>
            <button
              onClick={() => navigate("/students")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all active-press"
            >
              Go to Student Directory
            </button>
          </div>
        </div>
      ) : null}

      {!successImport && totalCount === 0 ? (
        /* UPLOAD & GUIDELINE SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Draggable upload card */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all min-h-[350px] relative bg-white overflow-hidden group ${
                dragActive
                  ? "border-indigo-600 bg-indigo-50/30 scale-[0.99] shadow-inner"
                  : "border-slate-200 hover:border-indigo-500/70 hover:shadow-md"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-100 group-hover:scale-110 transition-all border border-indigo-100/30 mb-4">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                Upload your Student Enrollment CSV
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                Drag and drop your spreadsheet file directly into this frame, or click to browse files from your computer storage.
              </p>
              
              <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold tracking-wide uppercase border border-slate-100">
                Only support standard .csv files
              </div>
            </div>

            {/* Copy Sample Box */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Spreadsheet Quick Format Check</h3>
                </div>
                <button
                  onClick={handleCopyTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition-all active-press"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy Sample Data"}
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-slate-300 border border-slate-800 leading-relaxed scrollbar-thin">
                <div className="text-emerald-400 select-all font-bold">{csvTemplateHeader}</div>
                {csvTemplateRows.map((row, idx) => (
                  <div key={idx} className="truncate select-all">{row}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Import Instruction side block */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-900 tracking-tight">Import Requirements</h3>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <p>
                To maintain database integrity, make sure your Excel/CSV spreadsheet contains these column headers exactly (order does not matter):
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold font-mono">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">name</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">rollNo</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">regNo</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">email</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">phone</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">gender</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">dob</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">department</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">semester</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">section</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">address</div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-slate-700">cgpa</div>
              </div>

              <div className="space-y-2 border-t border-slate-50 pt-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Unique values:</strong> Roll, Reg No, and Email must be unique per student. Duplicate records will fail.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Gender options:</strong> Male, Female, or Other. Case-insensitive.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>DOB formatting:</strong> YYYY-MM-DD (e.g. 2004-05-15).</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>CGPA bounds:</strong> Standard numeric score between 0.0 and 10.0.</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all active-press"
            >
              <Download className="w-4 h-4" /> Download Standard Template
            </button>
          </div>

        </div>
      ) : null}

      {!successImport && totalCount > 0 ? (
        /* SPREADSHEET REVIEW GRID STAGE */
        <div className="space-y-6">
          
          {/* File summary bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                  {fileName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  File Size: {fileSize} &bull; Parsed {totalCount} records
                </p>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-100 hover:border-rose-100 transition-colors active-press md:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove &amp; Re-upload
            </button>
          </div>

          {/* Metrics overview widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase block">
                Total Rows Parsed
              </span>
              <span className="text-3xl font-black text-slate-800 block mt-1">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-slate-500 block mt-1">
                Found in CSV file
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100/50 shadow-sm bg-emerald-50/10">
              <span className="text-emerald-600 text-[10px] font-bold tracking-wider uppercase block">
                Valid Records
              </span>
              <span className="text-3xl font-black text-emerald-600 block mt-1">
                {validCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600/80 block mt-1">
                Ready for database registration
              </span>
            </div>

            <div className={`bg-white p-5 rounded-2xl border shadow-sm ${invalidCount > 0 ? "border-rose-100/80 bg-rose-50/10" : "border-slate-100"}`}>
              <span className={`text-[10px] font-bold tracking-wider uppercase block ${invalidCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                Invalid Records
              </span>
              <span className={`text-3xl font-black block mt-1 ${invalidCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
                {invalidCount}
              </span>
              <span className={`text-xs font-semibold block mt-1 ${invalidCount > 0 ? "text-rose-500" : "text-slate-500"}`}>
                {invalidCount > 0 ? "Formatting/field errors detected" : "All rows passed checks!"}
              </span>
            </div>

          </div>

          {/* Processing Banner Action Block */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900">Confirm Enrolling Spreadsheet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                {invalidCount > 0
                  ? `There are ${invalidCount} rows containing errors. If you proceed, only the ${validCount} valid student records will be uploaded, and the invalid lines will be skipped. You can also re-upload a fixed spreadsheet.`
                  : "All records are perfectly formatted. Click register below to bulk upload and register all student records into the system database."}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleRemoveFile}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all active-press"
              >
                Cancel
              </button>
              
              <button
                onClick={executeBulkImport}
                disabled={loading || validCount === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 disabled:shadow-none transition-all active-press"
              >
                {loading ? (
                  <>
                    <Loader size="sm" text="" /> Registering Students...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Import {validCount} Records
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table display of raw parsed records */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">Spreadsheet Records Preview</h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                Parsed Layout
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-400 tracking-wider uppercase">
                    <th className="px-6 py-4 w-12 text-center">Row</th>
                    <th className="px-6 py-4 w-28">Validation</th>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Roll / Reg No</th>
                    <th className="px-6 py-4">Dept / Sem</th>
                    <th className="px-6 py-4">CGPA</th>
                    <th className="px-6 py-4">Errors / Validation Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                  {records.map((rec) => (
                    <tr
                      key={rec.index}
                      className={`transition-colors ${
                        rec.isValid ? "hover:bg-slate-50/30" : "bg-rose-50/20 hover:bg-rose-50/40"
                      }`}
                    >
                      {/* Row index */}
                      <td className="px-6 py-4 text-center font-bold text-slate-400">
                        {rec.index}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4">
                        {rec.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100 uppercase tracking-wide">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-100 uppercase tracking-wide animate-shake">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>

                      {/* Student info */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-950 text-sm">
                          {rec.data.name || <span className="text-rose-400 font-medium italic">Missing Name</span>}
                        </div>
                        <div className="text-slate-400 mt-0.5 truncate max-w-xs">{rec.data.email || "Missing Email"}</div>
                      </td>

                      {/* Roll & Reg Nos */}
                      <td className="px-6 py-4 font-mono">
                        <span className="font-bold text-slate-800 block">
                          {rec.data.rollNo || <span className="text-rose-400 italic font-sans font-normal">No Roll</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {rec.data.regNo || <span className="text-rose-400 italic font-sans font-normal">No Reg</span>}
                        </span>
                      </td>

                      {/* Dept & Sem */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wide mr-1.5">
                          {rec.data.department || "No Dept"}
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {rec.data.semester ? `${rec.data.semester} Sem` : "No Sem"}
                        </span>
                      </td>

                      {/* CGPA */}
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {rec.data.cgpa !== undefined && rec.data.cgpa !== "" ? (
                          `★ ${parseFloat(rec.data.cgpa).toFixed(2)}`
                        ) : (
                          <span className="text-rose-400 italic font-normal">No CGPA</span>
                        )}
                      </td>

                      {/* Diagnostic Error Log */}
                      <td className="px-6 py-4 max-w-md">
                        {rec.isValid ? (
                          <span className="text-slate-400 italic">No formatting issues found. Ready to save.</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {rec.errors.map((err, errIdx) => (
                              <div key={errIdx} className="flex items-start gap-1 text-rose-600 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
