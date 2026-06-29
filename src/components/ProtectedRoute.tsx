import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route protector component to prevent guests from viewing authorized admin pages
 */
export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    // Force unauthorized users to login page
    return <Navigate to="/login" replace />;
  }

  // Render the matched route children
  return <Outlet />;
}
