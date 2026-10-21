
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },

    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Department code must be at least 2 characters"],
      maxlength: [20, "Department code cannot exceed 20 characters"],
      match: [
        /^[A-Z0-9_-]+$/,
        "Department code can contain only letters, numbers, underscores and hyphens",
      ],
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    departmentHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    financeApproverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model("Department", departmentSchema);

export default Department;
