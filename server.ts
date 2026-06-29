import express from "express";
import app from "./server/app.js";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./server/config/db.js";

const PORT = 3000;

/**
 * Boots the unified full-stack server.
 * This connects to the database, configures Vite middleware for real-time
 * client-side development, and starts the listener.
 */
async function startServer() {
  console.log("🌱 Starting Full-Stack Student Management System...");

  // 1. Establish database connection (or toggle to fallback memory)
  await connectDB();

  // 2. Configure Client-Side serving based on the environment
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️  [Vite Dev Mode]: Starting reactive compiler middleware...");
    
    // Create Vite server in middleware mode to run on the same Express port (3000)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Mount Vite development asset handlers and hot module loaders
    app.use(vite.middlewares);
  } else {
    console.log("📦 [Production Mode]: Mounting compiled static files...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve optimized client bundle
    app.use(express.static(distPath));
    
    // Fallback any client routes to our index.html (important for React Router SPA routes)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 3. Open port listener on 0.0.0.0 (necessary for container external access)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Server Online]: Listening on http://localhost:${PORT}`);
    console.log("✨ MERN environment successfully launched!");
  });
}

startServer();
