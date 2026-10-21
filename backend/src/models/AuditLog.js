
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      required: [true, "Audit action is required"],
      enum: [
        "REQUEST_CREATED",
        "REQUEST_UPDATED",
        "REQUEST_SUBMITTED",
        "REQUEST_WITHDRAWN",
        "REQUEST_APPROVED",
        "REQUEST_REJECTED",
        "REQUEST_RESUBMITTED",
        "BUDGET_RESERVED",
        "BUDGET_UPDATED",
        "POLICY_CREATED",
        "POLICY_UPDATED",
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DEACTIVATED",
        "DEPARTMENT_CREATED",
        "DEPARTMENT_UPDATED",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
      ],
    },

    entityType: {
      type: String,
      required: true,
      enum: [
        "User",
        "Department",
        "Budget",
        "ApprovalPolicy",
        "PurchaseRequest",
        "Authentication",
      ],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      default: null,
    },

    cycleNumber: {
      type: Number,
      min: 1,
      default: null,
      validate: {
        validator: (value) =>
          value === null || Number.isInteger(value),
        message: "Cycle number must be an integer or null",
      },
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Retrieve the audit history of a request in chronological order.
auditLogSchema.index({
  requestId: 1,
  createdAt: -1,
});

// Retrieve actions performed by a particular user.
auditLogSchema.index({
  actorId: 1,
  createdAt: -1,
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
