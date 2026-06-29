import { Router } from "express";
import { loginAdmin, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Endpoint for Admin Login (Public)
router.post("/login", loginAdmin);

// Endpoint to verify token and fetch current logged-in admin (Protected)
router.get("/me", protect as any, getMe as any);

export default router;
