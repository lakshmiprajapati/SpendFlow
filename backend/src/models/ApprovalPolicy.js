
import mongoose from "mongoose";

const approvalStepSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Sequence must be an integer",
      },
    },

    approverType: {
      type: String,
      required: true,
      enum: ["manager", "departmentHead", "financeApprover"],
    },

    required: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const approvalPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Policy name is required"],
      trim: true,
      maxlength: 100,
    },

    // null means organization-wide policy.
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    minAmountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Minimum amount must be an integer in paise",
      },
    },

    // null means no upper limit.
    maxAmountPaise: {
      type: Number,
      default: null,
      validate: {
        validator: (value) =>
          value === null ||
          (Number.isSafeInteger(value) && value >= 0),
        message: "Maximum amount must be a non-negative integer or null",
      },
    },

    steps: {
      type: [approvalStepSchema],
      required: true,
      validate: [
        {
          validator: (steps) =>
            Array.isArray(steps) && steps.length > 0,
          message: "At least one approval step is required",
        },
        {
          validator: (steps) => {
            const sequences = steps.map((step) => step.sequence);
            return (
              sequences.every(Number.isInteger) &&
              new Set(sequences).size === sequences.length
            );
          },
          message: "Approval step sequences must be unique",
        },
      ],
    },

    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Version must be an integer",
      },
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

// Helps find active policies for a department and amount range.
// Overlapping ranges must also be checked in the service layer.
approvalPolicySchema.index({
  departmentId: 1,
  isActive: 1,
  minAmountPaise: 1,
});

approvalPolicySchema.pre("validate", function () {
  if (
    this.maxAmountPaise !== null &&
    this.maxAmountPaise !== undefined &&
    this.maxAmountPaise < this.minAmountPaise
  ) {
    this.invalidate(
      "maxAmountPaise",
      "Maximum amount cannot be less than minimum amount"
    );
  }

  if (this.steps?.length) {
    const sequences = this.steps.map((step) => step.sequence);
    const sorted = [...sequences].sort((a, b) => a - b);

    if (!sorted.every((sequence, index) => sequence === index + 1)) {
      this.invalidate(
        "steps",
        "Approval sequences must start at 1 and be consecutive"
      );
    }
  }
});

const ApprovalPolicy = mongoose.model(
  "ApprovalPolicy",
  approvalPolicySchema
);

export default ApprovalPolicy;
