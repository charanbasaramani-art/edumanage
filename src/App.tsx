import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components & UI Tools
import ProtectedRoute from "./components/ProtectedRoute.js";
import DashboardLayout from "./components/DashboardLayout.js";
import { ToastContainer } from "./components/Toast.js";

// Core Pages
import Login from "./pages/Login.js";
import Dashboard from "./pages/Dashboard.js";
import Students from "./pages/Students.js";
import AddStudent from "./pages/AddStudent.js";
import EditStudent from "./pages/EditStudent.js";
import StudentDetails from "./pages/StudentDetails.js";
import ImportStudents from "./pages/ImportStudents.js";
import Departments from "./pages/Departments.js";
import NotFound from "./pages/NotFound.js";

/**
 * Main React Entry Point with Client-Side Router
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Universal Toast Container for reactive alert feedback */}
      <ToastContainer />

      <Routes>
        {/* Public Access Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Console Routes (Requires valid JWT session) */}
        <Route element={<ProtectedRoute />}>
          {/* Automatically redirect from root path "/" to our analytical dashboard "/dashboard" */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/students"
            element={
              <DashboardLayout>
                <Students />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/students/add"
            element={
              <DashboardLayout>
                <AddStudent />
              </DashboardLayout>
            }
          />

          <Route
            path="/students/import"
            element={
              <DashboardLayout>
                <ImportStudents />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/students/edit/:id"
            element={
              <DashboardLayout>
                <EditStudent />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/students/:id"
            element={
              <DashboardLayout>
                <StudentDetails />
              </DashboardLayout>
            }
          />
          
          <Route
            path="/departments"
            element={
              <DashboardLayout>
                <Departments />
              </DashboardLayout>
            }
          />
        </Route>

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
