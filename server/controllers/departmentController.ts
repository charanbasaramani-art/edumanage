import { Request, Response, NextFunction } from "express";
import { isDbConnected } from "../config/db.js";
import { Department } from "../models/Department.js";
import { Student } from "../models/Student.js";
import { fallbackStore } from "../config/fallbackStore.js";

/**
 * Get all departments
 * GET /api/departments
 */
export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let list: any[] = [];

    if (isDbConnected()) {
      list = await Department.find().sort({ name: 1 });
    } else {
      list = fallbackStore.departments.find().sort((a, b) => a.name.localeCompare(b.name));
    }

    // Enhance departments with student counters
    const enhancedList = await Promise.all(
      list.map(async (dept) => {
        let studentCount = 0;
        
        // Find how many students belong to this department
        if (isDbConnected()) {
          studentCount = await Student.countDocuments({ department: dept.code });
        } else {
          studentCount = fallbackStore.students.find().filter(s => s.department === dept.code).length;
        }

        // Return a plain object with the student count added
        const deptObj = dept.toObject ? dept.toObject() : { ...dept };
        return {
          ...deptObj,
          studentCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedList.length,
      data: enhancedList,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new department
 * POST /api/departments
 */
export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, message: "Department Name and Code are required" });
      return;
    }

    const deptCode = code.toUpperCase().trim();

    // Check if code or name already exists
    if (isDbConnected()) {
      const existingCode = await Department.findOne({ code: deptCode });
      if (existingCode) {
        res.status(400).json({ success: false, message: `Department code '${deptCode}' is already taken` });
        return;
      }
      const existingName = await Department.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
      if (existingName) {
        res.status(400).json({ success: false, message: `Department named '${name}' already exists` });
        return;
      }

      const newDept = await Department.create({ name: name.trim(), code: deptCode, description });
      res.status(201).json({ success: true, message: "Department created successfully!", data: newDept });
    } else {
      const existingCode = fallbackStore.departments.findOne({ code: deptCode });
      if (existingCode) {
        res.status(400).json({ success: false, message: `Department code '${deptCode}' is already taken` });
        return;
      }
      const existingName = fallbackStore.departments.findOne({ name });
      if (existingName) {
        res.status(400).json({ success: false, message: `Department named '${name}' already exists` });
        return;
      }

      const newDept = fallbackStore.departments.create({ name: name.trim(), code: deptCode, description: description || "" });
      res.status(201).json({ success: true, message: "Department created successfully!", data: newDept });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Edit an existing department
 * PUT /api/departments/:id
 */
export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, message: "Department Name and Code are required" });
      return;
    }

    const deptCode = code.toUpperCase().trim();

    if (isDbConnected()) {
      // Check if another department has the same code
      const duplicateCode = await Department.findOne({ code: deptCode, _id: { $ne: id } });
      if (duplicateCode) {
        res.status(400).json({ success: false, message: `Another department is already using code '${deptCode}'` });
        return;
      }

      // Check if another department has the same name
      const duplicateName = await Department.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") }, _id: { $ne: id } });
      if (duplicateName) {
        res.status(400).json({ success: false, message: `Another department is already named '${name}'` });
        return;
      }

      const oldDept = await Department.findById(id);
      if (!oldDept) {
        res.status(404).json({ success: false, message: "Department not found" });
        return;
      }

      // If department code is changing, we must update all students with that department code
      if (oldDept.code !== deptCode) {
        await Student.updateMany({ department: oldDept.code }, { department: deptCode });
      }

      const updatedDept = await Department.findByIdAndUpdate(
        id,
        { name: name.trim(), code: deptCode, description },
        { new: true, runValidators: true }
      );

      res.status(200).json({ success: true, message: "Department updated successfully!", data: updatedDept });
    } else {
      const oldDept = fallbackStore.departments.findById(id);
      if (!oldDept) {
        res.status(404).json({ success: false, message: "Department not found" });
        return;
      }

      // Check if another department has the same code
      const codeDept = fallbackStore.departments.findOne({ code: deptCode });
      if (codeDept && codeDept._id !== id) {
        res.status(400).json({ success: false, message: `Another department is already using code '${deptCode}'` });
        return;
      }

      const nameDept = fallbackStore.departments.findOne({ name });
      if (nameDept && nameDept._id !== id) {
        res.status(400).json({ success: false, message: `Another department is already named '${name}'` });
        return;
      }

      const updatedDept = fallbackStore.departments.findByIdAndUpdate(id, { name: name.trim(), code: deptCode, description: description || "" });
      res.status(200).json({ success: true, message: "Department updated successfully!", data: updatedDept });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a department
 * DELETE /api/departments/:id
 */
export async function deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const dept = await Department.findById(id);
      if (!dept) {
        res.status(404).json({ success: false, message: "Department not found" });
        return;
      }

      // Prevent deleting department if students are registered in it
      const hasStudents = await Student.exists({ department: dept.code });
      if (hasStudents) {
        res.status(400).json({
          success: false,
          message: `Cannot delete department '${dept.name}' because students are registered in it. Please move/delete them first.`,
        });
        return;
      }

      await Department.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Department deleted successfully!" });
    } else {
      const dept = fallbackStore.departments.findById(id);
      if (!dept) {
        res.status(404).json({ success: false, message: "Department not found" });
        return;
      }

      const hasStudents = fallbackStore.students.find().some(s => s.department === dept.code);
      if (hasStudents) {
        res.status(400).json({
          success: false,
          message: `Cannot delete department '${dept.name}' because students are registered in it. Please move/delete them first.`,
        });
        return;
      }

      fallbackStore.departments.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Department deleted successfully!" });
    }
  } catch (error) {
    next(error);
  }
}
