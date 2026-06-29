import { Request, Response, NextFunction } from "express";
import { isDbConnected } from "../config/db.js";
import { Student } from "../models/Student.js";
import { Department } from "../models/Department.js";
import { fallbackStore } from "../config/fallbackStore.js";

/**
 * Get all students (with Search, Filter, Sort, Pagination)
 * GET /api/students
 */
export async function getStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = (req.query.search as string || "").trim();
    const deptFilter = req.query.department as string || "";
    const semFilter = req.query.semester as string || "";
    const genderFilter = req.query.gender as string || "";
    const sortBy = req.query.sortBy as string || "createdAt";
    const sortOrder = req.query.sortOrder as string || "desc"; // desc or asc

    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);
    const skip = (page - 1) * limit;

    let students: any[] = [];
    let total = 0;

    if (isDbConnected()) {
      // 1. Setup Query Conditions for MongoDB
      const query: any = {};

      // Search (Name, RollNo, RegNo, Email)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { rollNo: { $regex: search, $options: "i" } },
          { regNo: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Department filter
      if (deptFilter && deptFilter !== "All") {
        query.department = deptFilter;
      }

      // Semester filter
      if (semFilter && semFilter !== "All") {
        query.semester = semFilter;
      }

      // Gender filter
      if (genderFilter && genderFilter !== "All") {
        query.gender = genderFilter;
      }

      // Sorting
      const sortQuery: any = {};
      sortQuery[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute Queries
      total = await Student.countDocuments(query);
      students = await Student.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit);
    } else {
      // 2. Fallback memory filtering and sorting
      let mockList = fallbackStore.students.find();

      // Search filtering
      if (search) {
        const lowerSearch = search.toLowerCase();
        mockList = mockList.filter(
          s =>
            s.name.toLowerCase().includes(lowerSearch) ||
            s.rollNo.toLowerCase().includes(lowerSearch) ||
            s.regNo.toLowerCase().includes(lowerSearch) ||
            s.email.toLowerCase().includes(lowerSearch)
        );
      }

      // Department filter
      if (deptFilter && deptFilter !== "All") {
        mockList = mockList.filter(s => s.department === deptFilter);
      }

      // Semester filter
      if (semFilter && semFilter !== "All") {
        mockList = mockList.filter(s => s.semester === semFilter);
      }

      // Gender filter
      if (genderFilter && genderFilter !== "All") {
        mockList = mockList.filter(s => s.gender === genderFilter);
      }

      // Sort
      mockList.sort((a: any, b: any) => {
        let fieldA = a[sortBy];
        let fieldB = b[sortBy];

        if (typeof fieldA === "string") {
          fieldA = fieldA.toLowerCase();
          fieldB = fieldB.toLowerCase();
          return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        } else if (fieldA instanceof Date) {
          return sortOrder === "asc" 
            ? fieldA.getTime() - fieldB.getTime() 
            : fieldB.getTime() - fieldA.getTime();
        } else {
          // Numbers (CGPA, etc.)
          return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
        }
      });

      total = mockList.length;
      students = mockList.slice(skip, skip + limit);
    }

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      data: students,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single student details
 * GET /api/students/:id
 */
export async function getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    let student = null;

    if (isDbConnected()) {
      student = await Student.findById(id);
    } else {
      student = fallbackStore.students.findById(id);
    }

    if (!student) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new student profile
 * POST /api/students
 */
export async function createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      rollNo,
      regNo,
      email,
      phone,
      gender,
      dob,
      department,
      semester,
      section,
      address,
      photo,
      cgpa,
      skills,
    } = req.body;

    // Check for missing required fields
    if (!name || !rollNo || !regNo || !email || !phone || !gender || !dob || !department || !semester || !section || !address || cgpa === undefined) {
      res.status(400).json({ success: false, message: "Please fill all required student information fields" });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const rollNoUpper = rollNo.toUpperCase().trim();
    const regNoUpper = regNo.toUpperCase().trim();

    if (isDbConnected()) {
      // Check for unique field collisions (Email, RollNo, RegNo)
      const emailExists = await Student.findOne({ email: emailLower });
      if (emailExists) {
        res.status(400).json({ success: false, message: `Email address '${emailLower}' is already registered` });
        return;
      }

      const rollExists = await Student.findOne({ rollNo: rollNoUpper });
      if (rollExists) {
        res.status(400).json({ success: false, message: `Roll Number '${rollNoUpper}' is already registered` });
        return;
      }

      const regExists = await Student.findOne({ regNo: regNoUpper });
      if (regExists) {
        res.status(400).json({ success: false, message: `Registration Number '${regNoUpper}' is already registered` });
        return;
      }

      const newStudent = await Student.create({
        name: name.trim(),
        rollNo: rollNoUpper,
        regNo: regNoUpper,
        email: emailLower,
        phone: phone.trim(),
        gender,
        dob: new Date(dob),
        department,
        semester,
        section: section.trim().toUpperCase(),
        address: address.trim(),
        photo: photo || undefined,
        cgpa: parseFloat(cgpa),
        skills: Array.isArray(skills) ? skills : [],
      });

      res.status(201).json({ success: true, message: "Student registered successfully!", data: newStudent });
    } else {
      // Local fallback checks
      const emailExists = fallbackStore.students.findOne({ email: emailLower });
      if (emailExists) {
        res.status(400).json({ success: false, message: `Email address '${emailLower}' is already registered` });
        return;
      }

      const rollExists = fallbackStore.students.findOne({ rollNo: rollNoUpper });
      if (rollExists) {
        res.status(400).json({ success: false, message: `Roll Number '${rollNoUpper}' is already registered` });
        return;
      }

      const regExists = fallbackStore.students.findOne({ regNo: regNoUpper });
      if (regExists) {
        res.status(400).json({ success: false, message: `Registration Number '${regNoUpper}' is already registered` });
        return;
      }

      const newStudent = fallbackStore.students.create({
        name: name.trim(),
        rollNo: rollNoUpper,
        regNo: regNoUpper,
        email: emailLower,
        phone: phone.trim(),
        gender,
        dob: new Date(dob),
        department,
        semester,
        section: section.trim().toUpperCase(),
        address: address.trim(),
        photo: photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
        cgpa: parseFloat(cgpa),
        skills: Array.isArray(skills) ? skills : [],
      });

      res.status(201).json({ success: true, message: "Student registered successfully!", data: newStudent });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Edit an existing student profile
 * PUT /api/students/:id
 */
export async function updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      rollNo,
      regNo,
      email,
      phone,
      gender,
      dob,
      department,
      semester,
      section,
      address,
      photo,
      cgpa,
      skills,
    } = req.body;

    if (!name || !rollNo || !regNo || !email || !phone || !gender || !dob || !department || !semester || !section || !address || cgpa === undefined) {
      res.status(400).json({ success: false, message: "Please fill all required student information fields" });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const rollNoUpper = rollNo.toUpperCase().trim();
    const regNoUpper = regNo.toUpperCase().trim();

    if (isDbConnected()) {
      // Validate uniqueness against other students
      const emailExists = await Student.findOne({ email: emailLower, _id: { $ne: id } });
      if (emailExists) {
        res.status(400).json({ success: false, message: `Another student is already using email '${emailLower}'` });
        return;
      }

      const rollExists = await Student.findOne({ rollNo: rollNoUpper, _id: { $ne: id } });
      if (rollExists) {
        res.status(400).json({ success: false, message: `Another student is already using Roll Number '${rollNoUpper}'` });
        return;
      }

      const regExists = await Student.findOne({ regNo: regNoUpper, _id: { $ne: id } });
      if (regExists) {
        res.status(400).json({ success: false, message: `Another student is already using Registration Number '${regNoUpper}'` });
        return;
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        {
          name: name.trim(),
          rollNo: rollNoUpper,
          regNo: regNoUpper,
          email: emailLower,
          phone: phone.trim(),
          gender,
          dob: new Date(dob),
          department,
          semester,
          section: section.trim().toUpperCase(),
          address: address.trim(),
          photo: photo || undefined,
          cgpa: parseFloat(cgpa),
          skills: Array.isArray(skills) ? skills : [],
        },
        { new: true, runValidators: true }
      );

      if (!updatedStudent) {
        res.status(404).json({ success: false, message: "Student profile not found" });
        return;
      }

      res.status(200).json({ success: true, message: "Student profile updated successfully!", data: updatedStudent });
    } else {
      // Fallback update
      const oldStudent = fallbackStore.students.findById(id);
      if (!oldStudent) {
        res.status(404).json({ success: false, message: "Student profile not found" });
        return;
      }

      const emailExists = fallbackStore.students.findOne({ email: emailLower });
      if (emailExists && emailExists._id !== id) {
        res.status(400).json({ success: false, message: `Another student is already using email '${emailLower}'` });
        return;
      }

      const rollExists = fallbackStore.students.findOne({ rollNo: rollNoUpper });
      if (rollExists && rollExists._id !== id) {
        res.status(400).json({ success: false, message: `Another student is already using Roll Number '${rollNoUpper}'` });
        return;
      }

      const regExists = fallbackStore.students.findOne({ regNo: regNoUpper });
      if (regExists && regExists._id !== id) {
        res.status(400).json({ success: false, message: `Another student is already using Registration Number '${regNoUpper}'` });
        return;
      }

      const updatedStudent = fallbackStore.students.findByIdAndUpdate(id, {
        name: name.trim(),
        rollNo: rollNoUpper,
        regNo: regNoUpper,
        email: emailLower,
        phone: phone.trim(),
        gender,
        dob: new Date(dob),
        department,
        semester,
        section: section.trim().toUpperCase(),
        address: address.trim(),
        photo: photo || oldStudent.photo,
        cgpa: parseFloat(cgpa),
        skills: Array.isArray(skills) ? skills : [],
      });

      res.status(200).json({ success: true, message: "Student profile updated successfully!", data: updatedStudent });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a student profile
 * DELETE /api/students/:id
 */
export async function deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    let deletedStudent = null;

    if (isDbConnected()) {
      deletedStudent = await Student.findByIdAndDelete(id);
    } else {
      deletedStudent = fallbackStore.students.findByIdAndDelete(id);
    }

    if (!deletedStudent) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Student profile deleted successfully!" });
  } catch (error) {
    next(error);
  }
}

/**
 * Get aggregated statistics for the main dashboard cards and analytics
 * GET /api/students/stats
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let totalStudents = 0;
    let totalDepartments = 0;
    let recentlyAdded: any[] = [];
    let departmentDistribution: { code: string; count: number }[] = [];
    let avgCgpa = 0;

    if (isDbConnected()) {
      totalStudents = await Student.countDocuments();
      totalDepartments = await Department.countDocuments();
      recentlyAdded = await Student.find().sort({ createdAt: -1 }).limit(5);

      // Average CGPA
      const cgpaResult = await Student.aggregate([
        { $group: { _id: null, avgCgpa: { $avg: "$cgpa" } } }
      ]);
      avgCgpa = cgpaResult.length > 0 ? parseFloat(cgpaResult[0].avgCgpa.toFixed(2)) : 0;

      // Department distribution
      const distribution = await Student.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } }
      ]);
      departmentDistribution = distribution.map(d => ({
        code: d._id || "Unknown",
        count: d.count,
      }));
    } else {
      // Fallback statistical calculations
      const students = fallbackStore.students.find();
      const departments = fallbackStore.departments.find();

      totalStudents = students.length;
      totalDepartments = departments.length;
      recentlyAdded = [...students].sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

      if (totalStudents > 0) {
        const sum = students.reduce((acc, s) => acc + s.cgpa, 0);
        avgCgpa = parseFloat((sum / totalStudents).toFixed(2));
      }

      // Department counts
      const countsMap: { [key: string]: number } = {};
      students.forEach(s => {
        countsMap[s.department] = (countsMap[s.department] || 0) + 1;
      });
      departmentDistribution = Object.keys(countsMap).map(code => ({
        code,
        count: countsMap[code],
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalDepartments,
        avgCgpa,
        recentlyAdded,
        departmentDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk import multiple student records with validation
 * POST /api/students/bulk-import
 */
export async function bulkImportStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, message: "No student records provided for import" });
      return;
    }

    const imported: any[] = [];
    const errors: { name: string; rollNo?: string; email?: string; reason: string }[] = [];

    if (isDbConnected()) {
      for (const item of students) {
        const {
          name,
          rollNo,
          regNo,
          email,
          phone,
          gender,
          dob,
          department,
          semester,
          section,
          address,
          photo,
          cgpa,
          skills,
        } = item;

        // Double check required fields
        if (!name || !rollNo || !regNo || !email || !phone || !gender || !dob || !department || !semester || !section || !address || cgpa === undefined) {
          errors.push({ name: name || "Unknown", rollNo, email, reason: "Missing required fields" });
          continue;
        }

        const emailLower = email.toLowerCase().trim();
        const rollNoUpper = rollNo.toUpperCase().trim();
        const regNoUpper = regNo.toUpperCase().trim();

        // Check for duplicates in current import batch to prevent inserting duplicates from the same CSV
        const isDuplicateInBatch = imported.some(
          (s) => s.rollNo === rollNoUpper || s.regNo === regNoUpper || s.email === emailLower
        );
        if (isDuplicateInBatch) {
          errors.push({
            name,
            rollNo: rollNoUpper,
            email: emailLower,
            reason: "Duplicate roll number, registration number, or email in the import batch",
          });
          continue;
        }

        // Uniqueness check in MongoDB
        const existing = await Student.findOne({
          $or: [
            { email: emailLower },
            { rollNo: rollNoUpper },
            { regNo: regNoUpper }
          ]
        });

        if (existing) {
          let reason = "Record already exists";
          if (existing.email === emailLower) {
            reason = `Email '${emailLower}' is already registered`;
          } else if (existing.rollNo === rollNoUpper) {
            reason = `Roll Number '${rollNoUpper}' is already registered`;
          } else if (existing.regNo === regNoUpper) {
            reason = `Registration Number '${regNoUpper}' is already registered`;
          }
          errors.push({ name, rollNo: rollNoUpper, email: emailLower, reason });
          continue;
        }

        // Create student in MongoDB
        const newStudent = await Student.create({
          name: name.trim(),
          rollNo: rollNoUpper,
          regNo: regNoUpper,
          email: emailLower,
          phone: phone.trim(),
          gender,
          dob: new Date(dob),
          department,
          semester,
          section: section.trim().toUpperCase(),
          address: address.trim(),
          photo: photo || undefined,
          cgpa: parseFloat(cgpa),
          skills: Array.isArray(skills) ? skills : [],
        });

        imported.push(newStudent);
      }
    } else {
      // Local fallback bulk check & processing
      for (const item of students) {
        const {
          name,
          rollNo,
          regNo,
          email,
          phone,
          gender,
          dob,
          department,
          semester,
          section,
          address,
          photo,
          cgpa,
          skills,
        } = item;

        if (!name || !rollNo || !regNo || !email || !phone || !gender || !dob || !department || !semester || !section || !address || cgpa === undefined) {
          errors.push({ name: name || "Unknown", rollNo, email, reason: "Missing required fields" });
          continue;
        }

        const emailLower = email.toLowerCase().trim();
        const rollNoUpper = rollNo.toUpperCase().trim();
        const regNoUpper = regNo.toUpperCase().trim();

        // Check for duplicates in current import batch
        const isDuplicateInBatch = imported.some(
          (s) => s.rollNo === rollNoUpper || s.regNo === regNoUpper || s.email === emailLower
        );
        if (isDuplicateInBatch) {
          errors.push({
            name,
            rollNo: rollNoUpper,
            email: emailLower,
            reason: "Duplicate roll number, registration number, or email in the import batch",
          });
          continue;
        }

        // Uniqueness check in fallback memory store
        const emailExists = fallbackStore.students.findOne({ email: emailLower });
        const rollExists = fallbackStore.students.findOne({ rollNo: rollNoUpper });
        const regExists = fallbackStore.students.findOne({ regNo: regNoUpper });

        if (emailExists || rollExists || regExists) {
          let reason = "Record already exists";
          if (emailExists) {
            reason = `Email '${emailLower}' is already registered`;
          } else if (rollExists) {
            reason = `Roll Number '${rollNoUpper}' is already registered`;
          } else if (regExists) {
            reason = `Registration Number '${regNoUpper}' is already registered`;
          }
          errors.push({ name, rollNo: rollNoUpper, email: emailLower, reason });
          continue;
        }

        const newStudent = fallbackStore.students.create({
          name: name.trim(),
          rollNo: rollNoUpper,
          regNo: regNoUpper,
          email: emailLower,
          phone: phone.trim(),
          gender,
          dob: new Date(dob),
          department,
          semester,
          section: section.trim().toUpperCase(),
          address: address.trim(),
          photo: photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
          cgpa: parseFloat(cgpa),
          skills: Array.isArray(skills) ? skills : [],
        });

        imported.push(newStudent);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${imported.length} student records.`,
      importedCount: imported.length,
      failedCount: errors.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
}
