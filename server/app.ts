import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { isDbConnected, configureMongoDB } from "./config/db.js";
import { protect } from "./middleware/authMiddleware.js";

// Import custom routes
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

// Initialize the Express app
const app = express();

// Global Middlewares
// 1. CORS: Allows our API to handle requests from the browser
app.use(cors());

// 2. Body Parsers: Enables Express to read incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Simple Logger Middleware: Logs incoming HTTP requests to our server console
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📡 [API Request]: ${req.method} ${req.url}`);
  next();
});

// API Routes
// Register modular routing endpoints
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);

// Database Connection Status check for the frontend UI
app.get("/api/db-status", (req: Request, res: Response) => {
  res.json({
    connected: isDbConnected(),
    mode: isDbConnected() ? "MongoDB Atlas (Cloud)" : "In-Memory Storage (Local Fallback)",
    tip: isDbConnected() 
      ? "You are connected to a persistent cloud database!" 
      : "No MONGODB_URI found. Changes will reset when the server restarts. Add MONGODB_URI to keep your data safe!"
  });
});

// Database Dynamic Configuration (Protected - only logged-in admins can update)
app.post("/api/db-status/configure", protect as any, async (req: Request, res: Response) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      res.status(400).json({ success: false, message: "MongoDB connection string (URI) is required." });
      return;
    }

    const result = await configureMongoDB(uri);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        connected: true,
        mode: "MongoDB Atlas (Cloud)"
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred during database configuration."
    });
  }
});


// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Global Error Handler Middleware
// Ensures that any crash or async error is caught and returned as a clean JSON response
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ [Global Server Error]:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred."
  });
});

export default app;
