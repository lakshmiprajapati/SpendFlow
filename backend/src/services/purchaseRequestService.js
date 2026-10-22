
import mongoose from "mongoose";

import User from "../models/User.js";
import Department from "../models/Department.js";
import PurchaseRequest from "../models/PurchaseRequest.js";

import {
  validatePurchaseRequestInput,
} from "../utils/requestValidation.js";

export const createPurchaseRequest = async (userId, input) => {
  // Validate incoming fields.
  const validation = validatePurchaseRequestInput(input);

  if (!validation.valid) {
    const error = new Error("Invalid purchase request data");
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }

  // Verify authenticated user's ID.
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId).select(
    "_id departmentId isActive roles"
  );

  if (!user || !user.isActive) {
    const error = new Error("User is unavailable or inactive");
    error.statusCode = 401;
    throw error;
  }

  if (!user.roles.includes("employee")) {
    const error = new Error("Only employees can create purchase requests");
    error.statusCode = 403;
    throw error;
  }

  if (!user.departmentId) {
    const error = new Error("User must belong to a department");
    error.statusCode = 400;
    throw error;
  }

  const department = await Department.findOne({
    _id: user.departmentId,
    isActive: true,
  }).select("_id");

  if (!department) {
    const error = new Error("User's department is unavailable");
    error.statusCode = 400;
    throw error;
  }

  // Never trust client-supplied IDs, status or total amount.
  const totalAmountPaise = input.quantity * input.unitPricePaise;

  const purchaseRequest = await PurchaseRequest.create({
    requesterId: user._id,
    departmentId: department._id,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    justification: input.justification.trim(),
    quantity: input.quantity,
    unitPricePaise: input.unitPricePaise,
    totalAmountPaise,
    status: "draft",
  });

  return purchaseRequest;
};
