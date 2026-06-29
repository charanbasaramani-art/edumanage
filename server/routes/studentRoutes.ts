import { Router } from "express";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  bulkImportStudents,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Secure all student routes with JWT verification middleware
router.use(protect as any);

// Crucial: define /stats and /bulk-import routes BEFORE /:id route so the router doesn't match them as a student ID!
router.get("/stats", getDashboardStats);
router.post("/bulk-import", bulkImportStudents);

router.get("/", getStudents);
router.get("/:id", getStudentById);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
