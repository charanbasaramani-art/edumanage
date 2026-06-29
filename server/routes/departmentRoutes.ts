import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Secure all department routes with JWT validation middleware
router.use(protect as any);

router.get("/", getDepartments);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;
