import mongoose from "mongoose";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { Admin } from "../models/Admin.js";

// Load environment variables from .env or system secrets with local override priority
dotenv.config({ override: true });

// Track database connection status
let isConnected = false;

/**
 * Establishes a connection to MongoDB Atlas.
 * If the connection fails or MONGODB_URI is absent, it handles the state gracefully
 * so the application can run in fallback (in-memory) mode.
 */
export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("your-mongodb-atlas") || uri.includes("MY_MONGODB_URI")) {
    console.warn("⚠️  [DB Warning]: No valid MONGODB_URI found in environment variables.");
    console.warn("🚀 Running in [Local Fallback Mode] using memory storage. Data will not persist across server restarts.");
    console.warn("💡 To use persistent cloud storage, configure MONGODB_URI in your environment settings.");
    isConnected = false;
    return false;
  }

  try {
    // Attempt connecting using Mongoose
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB Connected]: Host - ${conn.connection.host}`);
    isConnected = true;

    // Seed default admin user if the Admin collection is empty
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash("admin123", salt);
        await Admin.create({
          username: "admin",
          password: hashedPassword,
        });
        console.log("✅ [MongoDB]: Seeded default admin user (admin / admin123)");
      }
    } catch (seedErr: any) {
      console.error(`⚠️ [MongoDB Seeding Failed]: ${seedErr.message}`);
    }

    return true;
  } catch (error: any) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    console.warn("🚀 Falling back to [Local Fallback Mode] due to connection failure.");
    isConnected = false;
    return false;
  }
}

/**
 * Dynamically tests connection to a new MongoDB URI and saves it to .env if successful.
 */
export async function configureMongoDB(uri: string): Promise<{ success: boolean; message: string }> {
  try {
    // First, disconnect existing mongoose connection if connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000 // fail fast if wrong credentials
    });

    console.log(`✅ [MongoDB Configured Successfully]: Host - ${conn.connection.host}`);
    isConnected = true;

    // Seed default admin user if the Admin collection is empty
    try {
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash("admin123", salt);
        await Admin.create({
          username: "admin",
          password: hashedPassword,
        });
        console.log("✅ [MongoDB]: Seeded default admin user (admin / admin123)");
      }
    } catch (seedErr: any) {
      console.error(`⚠️ [MongoDB Seeding Failed]: ${seedErr.message}`);
    }

    // Persist to .env file
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Replace or append MONGODB_URI
    const hasMongoURI = /MONGODB_URI=.*/.test(envContent);
    if (hasMongoURI) {
      envContent = envContent.replace(/MONGODB_URI=.*/, `MONGODB_URI="${uri}"`);
    } else {
      envContent += `\nMONGODB_URI="${uri}"`;
    }

    // Also write JWT_SECRET if it doesn't exist
    if (!/JWT_SECRET=.*/.test(envContent)) {
      envContent += `\nJWT_SECRET="db_manage_secure_jwt_secret_token_key_change_me_2026"`;
    }

    fs.writeFileSync(envPath, envContent, "utf-8");
    process.env.MONGODB_URI = uri;

    return {
      success: true,
      message: `Successfully connected to MongoDB host: ${conn.connection.host}! Configuration saved to .env file.`
    };
  } catch (error: any) {
    console.error(`❌ [MongoDB Configure Failed]: ${error.message}`);
    
    // Reconnect to original URI if it was valid
    const originalUri = process.env.MONGODB_URI;
    if (originalUri && originalUri !== uri) {
      try {
        await mongoose.connect(originalUri);
        isConnected = true;
      } catch (e) {
        isConnected = false;
      }
    } else {
      isConnected = false;
    }

    return {
      success: false,
      message: error.message || "Failed to connect to MongoDB. Please double check your database credentials and network access."
    };
  }
}

/**
 * Helper function to check if the application is currently connected to MongoDB.
 */
export function isDbConnected(): boolean {
  return isConnected;
}
