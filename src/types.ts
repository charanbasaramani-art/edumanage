export interface AdminUser {
  id: string;
  username: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  name: string;
  rollNo: string;
  regNo: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  department: string; // Stored as department code (e.g. "CSE")
  semester: string;
  section: string;
  address: string;
  photo: string;
  cgpa: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DbStatus {
  connected: boolean;
  mode: string;
  tip: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalDepartments: number;
  avgCgpa: number;
  recentlyAdded: Student[];
  departmentDistribution: { code: string; count: number }[];
}
