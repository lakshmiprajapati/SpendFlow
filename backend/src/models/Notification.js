
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "REQUEST_SUBMITTED",
        "APPROVAL_PENDING",
        "REQUEST_APPROVED",
        "REQUEST_REJECTED",
        "REQUEST_RESUBMITTED",
        "REQUEST_WITHDRAWN",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    entityType: {
      type: String,
      enum: ["PurchaseRequest"],
      default: "PurchaseRequest",
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
