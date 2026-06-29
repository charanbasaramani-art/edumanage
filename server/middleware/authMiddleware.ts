import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-super-secure-student-management-secret-9988";

export interface IAuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
  };
}

/**
 * Middleware to protect routes and verify admin login status via JWT
 */
export function protect(req: IAuthRequest, res: Response, next: NextFunction): void {
  try {
    let token = "";

    // 1. Check if token is provided in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized! No security token was provided.",
      });
      return;
    }

    // 2. Verify token validity
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };

    // 3. Attach decoded admin info to request
    req.admin = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error: any) {
    console.error("⚠️ [Auth Middleware Error]:", error.message);
    res.status(401).json({
      success: false,
      message: "Authorization expired or invalid. Please log in again.",
    });
  }
}
