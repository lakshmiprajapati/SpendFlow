
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },

    fiscalYear: {
      type: String,
      required: [true, "Fiscal year is required"],
      match: [
        /^\d{4}-\d{2}$/,
        "Fiscal year must be in YYYY-YY format, e.g. 2026-27",
      ],
    },

    allocatedPaise: {
      type: Number,
      required: [true, "Allocated budget is required"],
      min: [0, "Allocated budget cannot be negative"],
      validate: {
        validator: Number.isSafeInteger,
        message: "Allocated budget must be a safe integer in paise",
      },
    },

    committedPaise: {
      type: Number,
      default: 0,
      min: [0, "Committed budget cannot be negative"],
      validate: {
        validator: Number.isSafeInteger,
        message: "Committed budget must be a safe integer in paise",
      },
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

// One budget per department per fiscal year.
budgetSchema.index(
  { departmentId: 1, fiscalYear: 1 },
  { unique: true }
);

// Calculated value; not stored separately in MongoDB.
budgetSchema.virtual("remainingPaise").get(function () {
  return this.allocatedPaise - this.committedPaise;
});

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
