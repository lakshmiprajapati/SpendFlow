
import mongoose from "mongoose";

import User from "../models/User.js";
import Department from "../models/Department.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import ApprovalPolicy from "../models/ApprovalPolicy.js";
import AuditLog from "../models/AuditLog.js";
import Budget from "../models/Budget.js";

import {
  validatePurchaseRequestInput,
} from "../utils/requestValidation.js";


const selectApprovalPolicy = async (departmentId, amountPaise) => {
  const matchingPolicies = await ApprovalPolicy.find({
    isActive: true,
    minAmountPaise: { $lte: amountPaise },
    $and: [
      {
        $or: [
          { maxAmountPaise: null },
          { maxAmountPaise: { $gte: amountPaise } },
        ],
      },
      {
        $or: [
          { departmentId },
          { departmentId: null },
        ],
      },
    ],
  });

  const departmentPolicies = matchingPolicies.filter(
    (policy) =>
      policy.departmentId?.toString() === departmentId.toString()
  );

  const candidates = departmentPolicies.length
    ? departmentPolicies
    : matchingPolicies.filter((policy) => policy.departmentId == null);

  if (candidates.length === 0) {
    const error = new Error(
      "No active approval policy found for this department and amount"
    );
    error.statusCode = 400;
    throw error;
  }

  if (candidates.length > 1) {
    const error = new Error(
      "Multiple approval policies match this request. Please contact an administrator."
    );
    error.statusCode = 409;
    throw error;
  }

  return candidates[0];
};




const resolveApprovalSteps = async (policy, department) => {
  const approverFieldByType = {
    manager: "managerId",
    departmentHead: "departmentHeadId",
  };

  const steps = [];
  const errors = [];

  for (const policyStep of [...policy.steps].sort(
    (a, b) => a.sequence - b.sequence
  )) {
    const departmentField =
      approverFieldByType[policyStep.approverType];

    // Ignore approval types not supported by this workflow.
    if (!departmentField) {
      if (policyStep.required) {
        errors.push(
          `Unsupported required approver type: ${policyStep.approverType}`
        );
      }
      continue;
    }

    const approverId = department[departmentField];

    if (!approverId) {
      if (policyStep.required) {
        errors.push(
          `Required ${policyStep.approverType} is not configured for this department`
        );
      }
      continue;
    }

    const approver = await User.findOne({
      _id: approverId,
      isActive: true,
      roles: policyStep.approverType,
    }).select("_id");

    if (!approver) {
      if (policyStep.required) {
        errors.push(
          `Required ${policyStep.approverType} is unavailable or does not have the required role`
        );
      }
      continue;
    }

    steps.push({
      sequence: policyStep.sequence,
      approverType: policyStep.approverType,
      approverId: approver._id,
      status: "pending",
      decidedBy: null,
      decidedAt: null,
      comment: "",
    });
  }

  if (errors.length > 0) {
    const error = new Error(
      "Approval workflow cannot be created because an approver is unavailable"
    );
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  if (steps.length === 0) {
    const error = new Error(
      "Approval policy has no resolvable approvers"
    );
    error.statusCode = 400;
    throw error;
  }

  return steps;
};




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


export const getMyPurchaseRequests = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId).select(
    "_id isActive roles"
  );

  if (!user || !user.isActive) {
    const error = new Error("User is unavailable or inactive");
    error.statusCode = 401;
    throw error;
  }

  if (!user.roles.includes("employee")) {
    const error = new Error(
      "Only employees can view their purchase requests"
    );
    error.statusCode = 403;
    throw error;
  }

  const requests = await PurchaseRequest.find({
    requesterId: user._id,
  })
    .sort({ createdAt: -1 })
    .select(
      "title description justification quantity unitPricePaise totalAmountPaise status currentCycleNumber createdAt updatedAt"
    )
    .lean();

  return requests;
};


export const getPurchaseRequestById = async (userId, requestId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user");
    error.statusCode = 401;
    throw error;
  }

  if (!mongoose.isValidObjectId(requestId)) {
    const error = new Error("Invalid purchase request ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select(
    "_id isActive roles"
  );

  if (!user || !user.isActive) {
    const error = new Error("User is unavailable or inactive");
    error.statusCode = 401;
    throw error;
  }

  if (!user.roles.includes("employee")) {
    const error = new Error(
      "Only employees can view purchase requests"
    );
    error.statusCode = 403;
    throw error;
  }

  const request = await PurchaseRequest.findOne({
    _id: requestId,
    requesterId: user._id,
  })
    .select(
      "title description justification quantity unitPricePaise totalAmountPaise status currentCycleNumber lastRejectionReason createdAt updatedAt"
    )
    .lean();

  if (!request) {
    const error = new Error("Purchase request not found");
    error.statusCode = 404;
    throw error;
  }

  return request;
};







export async function updateDraftPurchaseRequest({
  userId,
  requestId,
  input,
}) {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(requestId)
  ) {
    const error = new Error("Invalid user ID or request ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select(
    "_id isActive roles departmentId"
  );

  if (!user || !user.isActive) {
    const error = new Error("User not found or inactive");
    error.statusCode = 401;
    throw error;
  }

  if (!user.roles.includes("employee")) {
    const error = new Error("Only employees can update purchase requests");
    error.statusCode = 403;
    throw error;
  }

  const request = await PurchaseRequest.findOne({
    _id: requestId,
    requesterId: user._id,
  });

  if (!request) {
    const error = new Error("Purchase request not found");
    error.statusCode = 404;
    throw error;
  }

  if (!["draft", "rejected"].includes(request.status)) {
    const error = new Error(
      "Only draft or rejected requests can be edited"
    );
    error.statusCode = 409;
    throw error;
  }

  if (
    !user.departmentId ||
    request.departmentId.toString() !== user.departmentId.toString()
  ) {
    const error = new Error(
      "You can only edit requests from your own department"
    );
    error.statusCode = 403;
    throw error;
  }

  const validation = validatePurchaseRequestInput(input);

  if (!validation.valid) {
    const error = new Error("Invalid purchase request data");
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }

  request.title = input.title.trim();
  request.description = input.description?.trim() ?? "";
  request.justification = input.justification.trim();
  request.quantity = input.quantity;
  request.unitPricePaise = input.unitPricePaise;
  request.totalAmountPaise = input.quantity * input.unitPricePaise;

  await request.save();

  return request;
}








export async function submitPurchaseRequest({ userId, requestId }) {
  // 1. Validate IDs
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(requestId)
  ) {
    const error = new Error("Invalid user ID or request ID");
    error.statusCode = 400;
    throw error;
  }

  // 2. Find active user
  const user = await User.findById(userId).select(
    "_id isActive roles departmentId"
  );

  if (!user || !user.isActive) {
    const error = new Error("User not found or inactive");
    error.statusCode = 401;
    throw error;
  }

  // 3. Only employees can submit requests
  if (!user.roles.includes("employee")) {
    const error = new Error(
      "Only employees can submit purchase requests"
    );
    error.statusCode = 403;
    throw error;
  }

  // 4. Find request owned by this user
  const request = await PurchaseRequest.findOne({
    _id: requestId,
    requesterId: user._id,
  });

  if (!request) {
    const error = new Error("Purchase request not found");
    error.statusCode = 404;
    throw error;
  }

  // 5. Allow draft and rejected requests only
  if (!["draft", "rejected"].includes(request.status)) {
    const error = new Error(
      "Only draft or rejected requests can be submitted"
    );
    error.statusCode = 409;
    throw error;
  }

  // 6. Verify department ownership
  if (
    !user.departmentId ||
    request.departmentId.toString() !== user.departmentId.toString()
  ) {
    const error = new Error(
      "You can only submit requests from your own department"
    );
    error.statusCode = 403;
    throw error;
  }

  // 7. Find active department
  const department = await Department.findOne({
    _id: request.departmentId,
    isActive: true,
  }).select(
    "_id managerId departmentHeadId financeApproverId"
  );

  if (!department) {
    const error = new Error("Active department not found");
    error.statusCode = 409;
    throw error;
  }

  // 8. Select applicable approval policy
  const policy = await selectApprovalPolicy(
    request.departmentId,
    request.totalAmountPaise
  );

  // 9. Resolve sequential approval steps
  const steps = await resolveApprovalSteps(policy, department);

  // 10. Create the next approval cycle
  const nextCycleNumber = request.currentCycleNumber + 1;

  request.approvalCycles.push({
    cycleNumber: nextCycleNumber,
    policyId: policy._id,
    policyVersion: policy.version,
    submittedAt: new Date(),
    completedAt: null,
    steps,
  });

  request.currentCycleNumber = nextCycleNumber;
  request.status = "pending_approval";
  request.lastRejectionReason = "";

  await request.save();

  // 11. Record the submission in the audit log
  await AuditLog.create({
    actorId: user._id,
    action:
      nextCycleNumber > 1
        ? "REQUEST_RESUBMITTED"
        : "REQUEST_SUBMITTED",
    entityType: "PurchaseRequest",
    entityId: request._id,
    requestId: request._id,
    cycleNumber: nextCycleNumber,
    metadata: {
      resubmitted: nextCycleNumber > 1,
    },
  });

  return request;
}







export const decidePurchaseRequest = async (
  userId,
  requestId,
  decision,
  comment = ""
) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user");
    error.statusCode = 401;
    throw error;
  }

  if (!mongoose.isValidObjectId(requestId)) {
    const error = new Error("Invalid purchase request ID");
    error.statusCode = 400;
    throw error;
  }

  if (!["approve", "reject"].includes(decision)) {
    const error = new Error("Decision must be either approve or reject");
    error.statusCode = 400;
    throw error;
  }

  if (typeof comment !== "string" || comment.trim().length > 1000) {
    const error = new Error("Comment must be a string of at most 1000 characters");
    error.statusCode = 400;
    throw error;
  }

  if (decision === "reject" && !comment.trim()) {
    const error = new Error("A rejection reason is required");
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  let updatedRequest;

  try {
    await session.withTransaction(async () => {
      const approver = await User.findById(userId)
        .select("_id isActive roles")
        .session(session);

      const allowedRoles = [
        "manager",
        "departmentHead",
      ];

      if (!approver || !approver.isActive) {
        const error = new Error("User is unavailable or inactive");
        error.statusCode = 401;
        throw error;
      }

      if (!approver.roles.some((role) => allowedRoles.includes(role))) {
        const error = new Error("Only authorized approvers can decide approval requests");
        error.statusCode = 403;
        throw error;
      }

      const request = await PurchaseRequest.findById(requestId).session(session);

      if (!request) {
        const error = new Error("Purchase request not found");
        error.statusCode = 404;
        throw error;
      }

      if (request.status !== "pending_approval") {
        const error = new Error("This request is not pending approval");
        error.statusCode = 409;
        throw error;
      }

      const currentCycle = request.approvalCycles.find(
        (cycle) => cycle.cycleNumber === request.currentCycleNumber
      );

      if (!currentCycle) {
        const error = new Error("Current approval cycle not found");
        error.statusCode = 409;
        throw error;
      }

      const step = currentCycle.steps.find(
        (item) =>
          item.approverId &&
          item.approverId.toString() === approver._id.toString() &&
          item.status === "pending"
      );

      if (!step) {
        const error = new Error("No pending approval step is assigned to this approver");
        error.statusCode = 403;
        throw error;
      }

      const nextStep = currentCycle.steps
        .filter((item) => item.status === "pending")
        .sort((a, b) => a.sequence - b.sequence)[0];

      if (!nextStep || nextStep.sequence !== step.sequence) {
        const error = new Error("Previous approval steps must be completed first");
        error.statusCode = 409;
        throw error;
      }

      const decidedAt = new Date();

      step.status = decision === "approve" ? "approved" : "rejected";
      step.decidedBy = approver._id;
      step.decidedAt = decidedAt;
      step.comment = comment.trim();

      if (decision === "reject") {
        request.status = "rejected";
        request.lastRejectionReason = comment.trim();
        currentCycle.completedAt = decidedAt;
      } else {
        const hasPendingSteps = currentCycle.steps.some(
          (item) => item.status === "pending"
        );

        if (hasPendingSteps) {
          request.status = "pending_approval";
        } else {
          // All approval steps are complete: reserve the budget.
          const now = new Date();
          const fiscalYear =
            now.getUTCMonth() >= 3
              ? `${now.getUTCFullYear()}-${String(
                  (now.getUTCFullYear() + 1) % 100
                ).padStart(2, "0")}`
              : `${now.getUTCFullYear() - 1}-${String(
                  now.getUTCFullYear() % 100
                ).padStart(2, "0")}`;

          const budget = await Budget.findOneAndUpdate(
            {
              departmentId: request.departmentId,
              fiscalYear,
              $expr: {
                $lte: [
                  { $add: ["$committedPaise", request.totalAmountPaise] },
                  "$allocatedPaise",
                ],
              },
            },
            {
              $inc: { committedPaise: request.totalAmountPaise },
            },
            {
              new: true,
              runValidators: true,
              session,
            }
          );

          if (!budget) {
            const error = new Error(
              `No budget available for fiscal year ${fiscalYear}, or the remaining budget is insufficient`
            );
            error.statusCode = 409;
            throw error;
          }

          request.status = "approved";
          currentCycle.completedAt = decidedAt;

          await AuditLog.create(
            [
              {
                actorId: approver._id,
                action: "BUDGET_RESERVED",
                entityType: "Budget",
                entityId: budget._id,
                requestId: request._id,
                cycleNumber: currentCycle.cycleNumber,
                metadata: {
                  amountPaise: request.totalAmountPaise,
                  fiscalYear,
                  committedPaise: budget.committedPaise,
                },
              },
            ],
            { session }
          );
        }
      }

      await request.save({ session });

      await AuditLog.create(
        [
          {
            actorId: approver._id,
            action:
              decision === "approve"
                ? "REQUEST_APPROVED"
                : "REQUEST_REJECTED",
            entityType: "PurchaseRequest",
            entityId: request._id,
            requestId: request._id,
            cycleNumber: currentCycle.cycleNumber,
            metadata: {
              decision,
              comment: comment.trim(),
              approverRole: step.approverType,
            },
          },
        ],
        { session }
      );

      updatedRequest = request;
    });
  } finally {
    await session.endSession();
  }

  return updatedRequest;
};





export const resubmitPurchaseRequest = async (userId, requestId) => {
  if (
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(requestId)
  ) {
    const error = new Error("Invalid user or request ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select(
    "_id isActive roles departmentId"
  );

  if (
    !user ||
    !user.isActive ||
    !user.roles.includes("employee")
  ) {
    const error = new Error(
      "An active employee account is required"
    );
    error.statusCode = 403;
    throw error;
  }

  const request = await PurchaseRequest.findOne({
    _id: requestId,
    requesterId: user._id,
  });

  if (!request) {
    const error = new Error("Purchase request not found");
    error.statusCode = 404;
    throw error;
  }

  if (request.status !== "rejected") {
    const error = new Error(
      "Only rejected requests can be resubmitted"
    );
    error.statusCode = 409;
    throw error;
  }

  if (
    request.departmentId.toString() !==
    user.departmentId?.toString()
  ) {
    const error = new Error(
      "Your department does not match this request"
    );
    error.statusCode = 403;
    throw error;
  }

  const department = await Department.findOne({
    _id: request.departmentId,
    isActive: true,
  }).select(
    "_id managerId departmentHeadId financeApproverId"
  );

  if (!department) {
    const error = new Error(
      "Request department is unavailable or inactive"
    );
    error.statusCode = 409;
    throw error;
  }

  const policy = await selectApprovalPolicy(
    request.departmentId,
    request.totalAmountPaise
  );

  const steps = await resolveApprovalSteps(policy, department);

  const nextCycleNumber = request.currentCycleNumber + 1;
  const submittedAt = new Date();

  request.approvalCycles.push({
    cycleNumber: nextCycleNumber,
    policyId: policy._id,
    policyVersion: policy.version,
    submittedAt,
    completedAt: null,
    steps,
  });

  request.currentCycleNumber = nextCycleNumber;
  request.status = "pending_approval";
  request.lastRejectionReason = "";

  await request.save();

  await AuditLog.create({
    actorId: user._id,
    action: "REQUEST_RESUBMITTED",
    entityType: "PurchaseRequest",
    entityId: request._id,
    requestId: request._id,
    cycleNumber: nextCycleNumber,
    metadata: {
      previousCycleNumber: nextCycleNumber - 1,
      policyId: policy._id,
      policyVersion: policy.version,
    },
  });

  return request;
};






export const getPendingApprovals = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user");
    error.statusCode = 401;
    throw error;
  }

  const approver = await User.findById(userId).select(
    "_id isActive roles"
  );

  if (!approver || !approver.isActive) {
    const error = new Error("User is unavailable or inactive");
    error.statusCode = 401;
    throw error;
  }

  const allowedRoles = [
    "manager",
    "departmentHead",
    "financeApprover",
  ];

  if (!approver.roles.some((role) => allowedRoles.includes(role))) {
    const error = new Error(
      "Only authorized approvers can view pending approvals"
    );
    error.statusCode = 403;
    throw error;
  }

  const requests = await PurchaseRequest.find({
    status: "pending_approval",
  })
    .select(
      "requesterId departmentId title description justification quantity unitPricePaise totalAmountPaise status currentCycleNumber approvalCycles createdAt updatedAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  const pendingRequests = requests.filter((request) => {
    const currentCycle = request.approvalCycles.find(
      (cycle) => cycle.cycleNumber === request.currentCycleNumber
    );

    if (!currentCycle) {
      return false;
    }

    const nextStep = currentCycle.steps
      .filter((step) => step.status === "pending")
      .sort((a, b) => a.sequence - b.sequence)[0];

    return (
      nextStep &&
      nextStep.approverId.toString() === approver._id.toString()
    );
  });

  return pendingRequests;
};
