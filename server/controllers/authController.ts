import { Request, Response, NextFunction } from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { isDbConnected } from "../config/db.js";
import { Admin } from "../models/Admin.js";
import { fallbackStore } from "../config/fallbackStore.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-super-secure-student-management-secret-9988";

/**
 * Handles Admin Authentication
 * POST /api/auth/login
 */
export async function loginAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    // Validate request parameters
    if (!username || !password) {
      res.status(400).json({ success: false, message: "Username and password are required" });
      return;
    }

    let adminUser = null;
    let isPasswordMatch = false;

    if (isDbConnected()) {
      // 1. Fetch from Real MongoDB
      adminUser = await Admin.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
      if (adminUser) {
        isPasswordMatch = await bcryptjs.compare(password, adminUser.password);
      }
    } else {
      // 2. Fetch from Fallback Memory Store
      const mockAdmin = fallbackStore.admins.findByUsername(username);
      if (mockAdmin) {
        adminUser = mockAdmin;
        isPasswordMatch = await bcryptjs.compare(password, mockAdmin.passwordHash);
      }
    }

    if (!adminUser || !isPasswordMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials. Please try again." });
      return;
    }

    // Generate JWT Token
    // Expires in 7 days
    const token = jwt.sign(
      { id: adminUser._id, username: adminUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      admin: {
        id: adminUser._id,
        username: adminUser.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validates the token and returns the current admin details
 * GET /api/auth/me
 */
export async function getMe(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    const adminId = req.admin?.id;
    const username = req.admin?.username;

    res.status(200).json({
      success: true,
      admin: {
        id: adminId,
        username,
      },
    });
  } catch (error) {
    next(error);
  }
}
