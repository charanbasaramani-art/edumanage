import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Fallback checking to prevent overwriting model in hot reloads
export const Admin: mongoose.Model<any> = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
