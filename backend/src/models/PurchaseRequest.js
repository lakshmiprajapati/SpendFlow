
import mongoose from "mongoose";

const approvalStepSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
      min: 1,
    },

    approverType: {
      type: String,
      required: true,
      enum: ["manager", "departmentHead", "financeApprover"],
    },

    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "skipped"],
      default: "pending",
      required: true,
    },

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const approvalCycleSchema = new mongoose.Schema(
  {
    cycleNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalPolicy",
      required: true,
    },

    policyVersion: {
      type: Number,
      required: true,
      min: 1,
    },

    submittedAt: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    steps: {
      type: [approvalStepSchema],
      required: true,
      validate: {
        validator: (steps) =>
          Array.isArray(steps) && steps.length > 0,
        message: "An approval cycle must contain at least one step",
      },
    },
  },
  {
    _id: true,
  }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      immutable: true,
    },

    title: {
      type: String,
      required: [true, "Request title is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    justification: {
      type: String,
      required: [true, "Business justification is required"],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be a positive integer",
      },
    },

    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Unit price must be a non-negative integer in paise",
      },
    },

    totalAmountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Total amount must be a non-negative integer in paise",
      },
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "withdrawn",
      ],
      default: "draft",
      required: true,
    },

    currentCycleNumber: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Cycle number must be an integer",
      },
    },

    approvalCycles: {
      type: [approvalCycleSchema],
      default: [],
    },

    lastRejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Query requests by requester and status.
purchaseRequestSchema.index({
  requesterId: 1,
  status: 1,
  updatedAt: -1,
});

// Query requests by department and status.
purchaseRequestSchema.index({
  departmentId: 1,
  status: 1,
  createdAt: -1,
});

// Find requests assigned to a particular approver.
purchaseRequestSchema.index({
  "approvalCycles.steps.approverId": 1,
  status: 1,
});

// Calculate totals on document validation.
purchaseRequestSchema.pre("validate", function () {
  if (
    Number.isSafeInteger(this.quantity) &&
    Number.isSafeInteger(this.unitPricePaise) &&
    this.quantity >= 1 &&
    this.unitPricePaise >= 0
  ) {
    const total = this.quantity * this.unitPricePaise;

    if (Number.isSafeInteger(total)) {
      this.totalAmountPaise = total;
    } else {
      this.invalidate(
        "totalAmountPaise",
        "Purchase total exceeds the supported safe integer range"
      );
    }
  }
});

const PurchaseRequest = mongoose.model(
  "PurchaseRequest",
  purchaseRequestSchema
);

export default PurchaseRequest;
