import bcryptjs from "bcryptjs";

// Types for our fallback database structures
export interface IFallbackAdmin {
  _id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IFallbackDepartment {
  _id: string;
  name: string;
  code: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFallbackStudent {
  _id: string;
  name: string;
  rollNo: string;
  regNo: string;
  email: string;
  phone: string;
  gender: string;
  dob: Date;
  department: string; // code of the department
  semester: string;
  section: string;
  address: string;
  photo: string;
  cgpa: number;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Memory database states
let adminsList: IFallbackAdmin[] = [];
let departmentsList: IFallbackDepartment[] = [];
let studentsList: IFallbackStudent[] = [];

/**
 * Initializes the fallback databases with seed data
 */
export function initFallbackData() {
  console.log("💾 [Fallback DB]: Initializing in-memory mock storage...");

  // 1. Seed Admin (username: admin, password: admin123)
  const salt = bcryptjs.genSaltSync(10);
  const passwordHash = bcryptjs.hashSync("admin123", salt);
  
  adminsList = [
    {
      _id: "admin-1",
      username: "admin",
      passwordHash,
      createdAt: new Date(),
    }
  ];

  // 2. Seed Departments
  departmentsList = [
    {
      _id: "dept-1",
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Focuses on software, algorithms, data structures, and computing systems.",
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000), // 30 days ago
      updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    },
    {
      _id: "dept-2",
      name: "Electronics & Communication",
      code: "ECE",
      description: "Focuses on electronic circuits, microprocessors, and communication technologies.",
      createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000),
    },
    {
      _id: "dept-3",
      name: "Mechanical Engineering",
      code: "ME",
      description: "Deals with the design, manufacturing, and maintenance of mechanical systems.",
      createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
    }
  ];

  // 3. Seed Students
  studentsList = [
    {
      _id: "stud-1",
      name: "Alice Johnson",
      rollNo: "CS23101",
      regNo: "REG2023CS001",
      email: "alice.j@university.edu",
      phone: "+1-555-0101",
      gender: "Female",
      dob: new Date("2002-04-12"),
      department: "CSE",
      semester: "6th",
      section: "A",
      address: "123 Academic Dr, Building 4B, Suite 10",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
      cgpa: 9.2,
      skills: ["React", "TypeScript", "Node.js", "Python"],
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
    },
    {
      _id: "stud-2",
      name: "Ethan Smith",
      rollNo: "CS23102",
      regNo: "REG2023CS002",
      email: "ethan.s@university.edu",
      phone: "+1-555-0102",
      gender: "Male",
      dob: new Date("2001-09-24"),
      department: "CSE",
      semester: "6th",
      section: "B",
      address: "456 University Ave, Dorm Room 112",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
      cgpa: 8.5,
      skills: ["Java", "SQL", "HTML/CSS", "Git"],
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
    },
    {
      _id: "stud-3",
      name: "Sophia Martinez",
      rollNo: "EC23201",
      regNo: "REG2023EC011",
      email: "sophia.m@university.edu",
      phone: "+1-555-0109",
      gender: "Female",
      dob: new Date("2003-01-15"),
      department: "ECE",
      semester: "4th",
      section: "A",
      address: "789 Pine Rd, Apartment 3C",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256",
      cgpa: 9.6,
      skills: ["C++", "MATLAB", "Embedded Systems", "IoT"],
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    }
  ];

  console.log("✅ [Fallback DB]: Memory seed completed! Available accounts: admin / admin123");
}

// Auto-run on module load
initFallbackData();

// Data helper functions mimicking database operations
export const fallbackStore = {
  // Admins CRUD
  admins: {
    findByUsername: (username: string) => {
      return adminsList.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },
    findById: (id: string) => {
      return adminsList.find(u => u._id === id) || null;
    }
  },

  // Departments CRUD
  departments: {
    find: () => [...departmentsList],
    findOne: (query: { name?: string; code?: string }) => {
      if (query.name) {
        return departmentsList.find(d => d.name.toLowerCase() === query.name?.toLowerCase()) || null;
      }
      if (query.code) {
        return departmentsList.find(d => d.code.toUpperCase() === query.code?.toUpperCase()) || null;
      }
      return null;
    },
    findById: (id: string) => {
      return departmentsList.find(d => d._id === id) || null;
    },
    create: (data: Omit<IFallbackDepartment, "_id" | "createdAt" | "updatedAt">) => {
      const newDept: IFallbackDepartment = {
        _id: "dept-" + Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      departmentsList.push(newDept);
      return newDept;
    },
    findByIdAndUpdate: (id: string, data: Partial<IFallbackDepartment>) => {
      const idx = departmentsList.findIndex(d => d._id === id);
      if (idx === -1) return null;
      
      const oldDept = departmentsList[idx];
      // Check for code rename - we need to update student department references
      if (data.code && data.code.toUpperCase() !== oldDept.code) {
        const oldCode = oldDept.code;
        const newCode = data.code.toUpperCase();
        studentsList = studentsList.map(st => {
          if (st.department === oldCode) {
            return { ...st, department: newCode, updatedAt: new Date() };
          }
          return st;
        });
      }

      const updatedDept = {
        ...oldDept,
        ...data,
        code: data.code ? data.code.toUpperCase() : oldDept.code,
        updatedAt: new Date(),
      };
      departmentsList[idx] = updatedDept;
      return updatedDept;
    },
    findByIdAndDelete: (id: string) => {
      const idx = departmentsList.findIndex(d => d._id === id);
      if (idx === -1) return null;
      const deleted = departmentsList[idx];
      departmentsList.splice(idx, 1);
      return deleted;
    }
  },

  // Students CRUD
  students: {
    find: () => [...studentsList],
    findById: (id: string) => {
      return studentsList.find(s => s._id === id) || null;
    },
    findOne: (query: { rollNo?: string; regNo?: string; email?: string }) => {
      if (query.rollNo) {
        return studentsList.find(s => s.rollNo.toUpperCase() === query.rollNo?.toUpperCase()) || null;
      }
      if (query.regNo) {
        return studentsList.find(s => s.regNo.toUpperCase() === query.regNo?.toUpperCase()) || null;
      }
      if (query.email) {
        return studentsList.find(s => s.email.toLowerCase() === query.email?.toLowerCase()) || null;
      }
      return null;
    },
    create: (data: Omit<IFallbackStudent, "_id" | "createdAt" | "updatedAt">) => {
      const newStudent: IFallbackStudent = {
        _id: "stud-" + Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      studentsList.push(newStudent);
      return newStudent;
    },
    findByIdAndUpdate: (id: string, data: Partial<IFallbackStudent>) => {
      const idx = studentsList.findIndex(s => s._id === id);
      if (idx === -1) return null;
      const updatedStudent = {
        ...studentsList[idx],
        ...data,
        updatedAt: new Date(),
      };
      studentsList[idx] = updatedStudent;
      return updatedStudent;
    },
    findByIdAndDelete: (id: string) => {
      const idx = studentsList.findIndex(s => s._id === id);
      if (idx === -1) return null;
      const deleted = studentsList[idx];
      studentsList.splice(idx, 1);
      return deleted;
    }
  }
};
