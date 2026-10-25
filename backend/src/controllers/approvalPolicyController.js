
import mongoose from "mongoose";
import ApprovalPolicy from "../models/ApprovalPolicy.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";

const validatePolicyInput = ({
  name,
  departmentId,
  minAmount,
  maxAmount,
  steps,
}) => {
  const errors = [];

  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    errors.push("Policy name is required and must be at most 100 characters");
  }

  if (
    departmentId !== null &&
    departmentId !== undefined &&
    departmentId !== "" &&
    !mongoose.isValidObjectId(departmentId)
  ) {
    errors.push("Invalid departmentId");
  }

  if (
    typeof minAmount !== "number" ||
    !Number.isFinite(minAmount) ||
    minAmount < 0 ||
    !Number.isSafeInteger(minAmount * 100)
  ) {
    errors.push("Minimum amount must be a non-negative rupee amount with at most 2 decimal places");
  }

  if (
    maxAmount !== null &&
    maxAmount !== undefined &&
    (typeof maxAmount !== "number" ||
      !Number.isFinite(maxAmount) ||
      maxAmount < 0 ||
      !Number.isSafeInteger(maxAmount * 100))
  ) {
    errors.push("Maximum amount must be null or a non-negative rupee amount with at most 2 decimal places");
  }

  if (
    typeof minAmount === "number" &&
    typeof maxAmount === "number" &&
    maxAmount < minAmount
  ) {
    errors.push("Maximum amount cannot be less than minimum amount");
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push("At least one approval step is required");
  } else {
    const validTypes = ["manager", "departmentHead", "financeApprover"];
    const sequences = steps.map((step) => step.sequence);

    if (
      steps.some(
        (step) =>
          !Number.isInteger(step.sequence) ||
          step.sequence < 1 ||
          !validTypes.includes(step.approverType) ||
          (step.required !== undefined && typeof step.required !== "boolean")
      )
    ) {
      errors.push("Each step needs a valid sequence, approver type and optional required flag");
    }

    const sorted = [...sequences].sort((a, b) => a - b);

    if (
      new Set(sequences).size !== sequences.length ||
      !sorted.every((sequence, index) => sequence === index + 1)
    ) {
      errors.push("Approval step sequences must be unique and consecutive, starting at 1");
    }
  }

  return errors;
};

const checkAmountRangeOverlap = async ({
  departmentId,
  minAmountPaise,
  maxAmountPaise,
  excludeId,
}) => {
  const filter = {
    isActive: true,
    departmentId: departmentId || null,

    // Existing policy starts before or at the new policy's maximum.
    ...(maxAmountPaise !== null
      ? { minAmountPaise: { $lte: maxAmountPaise } }
      : {}),

    // Existing policy has no maximum, or ends at or after
    // the new policy's minimum.
    $or: [
      { maxAmountPaise: null },
      { maxAmountPaise: { $gte: minAmountPaise } },
    ],
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return ApprovalPolicy.findOne(filter).select("_id name");
};

export const getApprovalPolicies = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.departmentId) {
      if (!mongoose.isValidObjectId(req.query.departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid departmentId",
        });
      }

      filter.departmentId = req.query.departmentId;
    }

    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = req.query.isActive === "true";
    }

    const policies = await ApprovalPolicy.find(filter)
      .populate("departmentId", "name code")
      .sort({ minAmountPaise: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: policies.length,
      data: policies.map((policy) => ({
        ...policy,
        minAmount: policy.minAmountPaise / 100,
        maxAmount:
          policy.maxAmountPaise === null
            ? null
            : policy.maxAmountPaise / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const createApprovalPolicy = async (req, res, next) => {
  try {
    const {
      name,
      departmentId = null,
      minAmount,
      maxAmount = null,
      steps,
    } = req.body;

    const errors = validatePolicyInput({
      name,
      departmentId,
      minAmount,
      maxAmount,
      steps,
    });

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval policy",
        errors,
      });
    }

    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Active department not found",
        });
      }
    }

    const minAmountPaise = Math.round(minAmount * 100);
    const maxAmountPaise =
      maxAmount === null ? null : Math.round(maxAmount * 100);

    const overlap = await checkAmountRangeOverlap({
      departmentId,
      minAmountPaise,
      maxAmountPaise,
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: `Amount range overlaps with active policy "${overlap.name}"`,
      });
    }

    const policy = await ApprovalPolicy.create({
      name: name.trim(),
      departmentId: departmentId || null,
      minAmountPaise,
      maxAmountPaise,
      steps,
      version: 1,
      isActive: true,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: "POLICY_CREATED",
      entityType: "ApprovalPolicy",
      entityId: policy._id,
      metadata: {
        name: policy.name,
        version: policy.version,
      },
    });

    const result = await ApprovalPolicy.findById(policy._id)
      .populate("departmentId", "name code")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Approval policy created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateApprovalPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval policy ID",
      });
    }

    const policy = await ApprovalPolicy.findById(id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Approval policy not found",
      });
    }

    const {
      name = policy.name,
      departmentId = policy.departmentId?.toString() || null,
      minAmount =
        policy.minAmountPaise / 100,
      maxAmount =
        policy.maxAmountPaise === null
          ? null
          : policy.maxAmountPaise / 100,
      steps = policy.steps.map((step) => ({
        sequence: step.sequence,
        approverType: step.approverType,
        required: step.required,
      })),
      isActive = policy.isActive,
    } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const errors = validatePolicyInput({
      name,
      departmentId,
      minAmount,
      maxAmount,
      steps,
    });

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval policy",
        errors,
      });
    }

    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        isActive: true,
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Active department not found",
        });
      }
    }

    const minAmountPaise = Math.round(minAmount * 100);
    const maxAmountPaise =
      maxAmount === null ? null : Math.round(maxAmount * 100);

    if (isActive) {
      const overlap = await checkAmountRangeOverlap({
        departmentId,
        minAmountPaise,
        maxAmountPaise,
        excludeId: policy._id,
      });

      if (overlap) {
        return res.status(409).json({
          success: false,
          message: `Amount range overlaps with active policy "${overlap.name}"`,
        });
      }
    }

    policy.name = name.trim();
    policy.departmentId = departmentId || null;
    policy.minAmountPaise = minAmountPaise;
    policy.maxAmountPaise = maxAmountPaise;
    policy.steps = steps;
    policy.isActive = isActive;
    policy.version += 1;

    await policy.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: "POLICY_UPDATED",
      entityType: "ApprovalPolicy",
      entityId: policy._id,
      metadata: {
        name: policy.name,
        version: policy.version,
        isActive: policy.isActive,
      },
    });

    await policy.populate("departmentId", "name code");

    return res.status(200).json({
      success: true,
      message: "Approval policy updated successfully",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};
