import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    rollNo: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      trim: true,
    },
    regNo: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    department: {
      type: String, // Stored as department code or name
      required: [true, "Department is required"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
    },
    section: {
      type: String,
      required: [true, "Section is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    photo: {
      type: String, // URL or base64 placeholder
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    },
    cgpa: {
      type: Number,
      required: [true, "CGPA is required"],
      min: [0, "CGPA cannot be less than 0"],
      max: [10, "CGPA cannot be more than 10"],
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Student: mongoose.Model<any> = mongoose.models.Student || mongoose.model("Student", StudentSchema);
