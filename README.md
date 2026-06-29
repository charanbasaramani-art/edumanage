<<<<<<< HEAD
# Student Management System (Full-Stack MERN)

Welcome to the **Student Management System**, a highly responsive, clean, and production-ready full-stack application built using the modern MERN Stack.

This application has been meticulously designed with advanced usability features, visual feedback, error-handling mechanisms, and a **Seamless Hybrid DB Engine** that lets you run and test the application instantly out-of-the-box!

---

## 🚀 Key Features

### 🔒 1. Authentication & Security
- **Admin Authentication**: Secure login portal with password hashing via `bcryptjs`.
- **JWT Authorization**: Session verification using JSON Web Tokens (JWT) protecting all administrative endpoints.
- **Client Session Guards**: Protected routes in React Router preventing unauthorized access to the admin dashboard.
- **Automatic Session Expiry Handlers**: Gracefully signs out users if the authorization tokens expire.

### 📊 2. High-Level Dashboard
- **Numerical Metric Cards**: Real-time stats on total students, active departments, and overall performance averages.
- **Visual Analytics**: Interactive, responsive progress-bar indicators showing student counts and ratios by department.
- **Activity Feed**: Highlights the 5 most recently registered students with fast click-through navigation.

### 🎓 3. Student Profile Module
- **Comprehensive Profiles**: Tracks name, roll number, registration, email, contact, gender, DOB, branch, semester, section, address, and profile photo.
- **Skills Tagging**: Dynamic tag input system. Type keywords and hit `Enter` or `,` to map skills instantly.
- **Search, Filter & Sorting**:
  - Full-text search across student name, roll number, registration, or email.
  - Dropdown filters for departments, semesters, and genders.
  - Dynamic sort toggles by Name, Roll No, CGPA, or Date Registered.
- **Pagination**: Supports clean server-side query slicing to handle scale with minimal browser load.
- **Interactive Preset Photos**: Select from high-resolution academic portrait presets.

### 🏫 4. Departments Module
- **Branch Management**: View active divisions, register new fields of study with unique codes, or edit curriculum focus.
- **Integrity Blocks**: Prevents deletion of any department that currently has students enrolled in it, protecting database schemas.
- **Instant Student Counters**: Dynamic counts showcasing total students active under each program.

---

## 🛠️ Tech Stack & Architecture

### Backend: MVC Architecture (Express & Node.js)
- **MVC Design**: Separated concerns into **Models** (Mongoose blueprints), **Controllers** (API request lifecycle handlers), and **Routes** (modular HTTP routing).
- **Graceful DB Wrapper**: Configured to check for a valid `MONGODB_URI` environment variable. 
  - If **connected**, stores data in your real **MongoDB Atlas cloud database**.
  - If **offline**, activates **Fallback Memory Store** on the server, pre-seeded with departments, students, and a default admin (`admin` / `admin123`) so you can fully operate the app instantly.

### Frontend: React (Vite & Tailwind CSS v4)
- **Reactive Components**: Organized logically with shared forms, loaders, status indicators, and confirmation dialog modals.
- **Tailwind CSS v4**: High-contrast slate theme, clean typography pairing (**Plus Jakarta Sans** for display and **JetBrains Mono** for metrics), custom scrollbars, and active click-press effects.
- **Interactive Toast Notifications**: Event-driven custom toasts (success, warning, info, error) floating smoothly with slide-in animations.

---

## 📂 Project Tree Structure

```text
student-management-system/
│
├── server/
│   ├── config/
│   │   ├── db.ts               # MongoDB connector and configuration
│   │   └── fallbackStore.ts    # Fallback memory store mimicking mongoose
│   ├── controllers/
│   │   ├── authController.ts   # JWT signatures and validation
│   │   ├── departmentController.ts
│   │   └── studentController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts   # Secured route validation
│   ├── models/
│   │   ├── Admin.ts
│   │   ├── Department.ts
│   │   └── Student.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── departmentRoutes.ts
│   │   └── studentRoutes.ts
│   └── app.ts                  # Core express initialization and body-parsers
│
├── src/
│   ├── components/
│   │   ├── ConfirmDialog.tsx   # Custom delete safety dialogues
│   │   ├── DashboardLayout.tsx # Persistent sidebar and responsive header
│   │   ├── DbStatusBar.tsx     # Live database status ticker
│   │   ├── Loader.tsx          # Custom reactive spinner
│   │   ├── ProtectedRoute.tsx  # Admin route authentication guards
│   │   └── Toast.tsx           # Floating slide-in notification engine
│   ├── pages/
│   │   ├── Login.tsx           # Portal gate with quick prefill shortcut
│   │   ├── Dashboard.tsx       # Analytics graphs, cards & feeds
│   │   ├── Students.tsx        # Grid directory with deep search, sort, and filters
│   │   ├── AddStudent.tsx      # Multi-validated profile register
│   │   ├── EditStudent.tsx     # Student profile updater
│   │   ├── StudentDetails.tsx  # Detailed student visual transcript
│   │   ├── Departments.tsx     # Curriculum grids and inline quick draw edit
│   │   └── NotFound.tsx        # Elegant 404 guide
│   ├── App.tsx                 # Router map
│   ├── main.tsx
│   ├── types.ts                # TypeScript entity contracts
│   └── index.css               # Import Plus Jakarta Sans and Tailwind configurations
│
├── server.ts                   # Unified full-stack node starter
└── package.json
```

---

## 🏁 How to Run

1. **Add Your MongoDB Atlas Connection String (Optional but recommended for production)**:
   Define your connection details inside `.env.example` or your server's runtime environment variables:
   ```env
   MONGODB_URI="your-mongodb-atlas-connection-string"
   JWT_SECRET="your-secure-jwt-secret-key"
   ```

2. **Boot the Server**:
   Run the unified development script. This launches Express on port `3000` and transparently hooks up Vite compiler middleware on the exact same port!
   ```bash
   npm run dev
   ```

3. **Log In**:
   Access the local preview page. Click the **"Prefill Demo Credentials"** shortcut at the bottom of the login card, or enter:
   - **Username**: `admin`
   - **Password**: `admin123`
=======
# edumanage
>>>>>>> 8525d7eec9d413b038c9da9388c57529631163b1
