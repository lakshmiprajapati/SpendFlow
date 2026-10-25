
import mongoose from "mongoose";
import User from "../models/User.js";
import Budget from "../models/Budget.js";
import Department from "../models/Department.js";

// Get the logged-in user's department budget
export const getMyDepartmentBudget = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("departmentId");

    if (!user || !user.departmentId) {
      return res.status(404).json({
        success: false,
        message: "User department not found",
      });
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    const fiscalYear =
      month >= 3
        ? `${year}-${String((year + 1) % 100).padStart(2, "0")}`
        : `${year - 1}-${String(year % 100).padStart(2, "0")}`;

    const budget = await Budget.findOne({
      departmentId: user.departmentId,
      fiscalYear,
    }).populate("departmentId", "name code");

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found for current financial year",
        fiscalYear,
      });
    }

    const remainingPaise =
      budget.allocatedPaise - budget.committedPaise;

    return res.status(200).json({
      success: true,
      data: {
        fiscalYear: budget.fiscalYear,
        department: budget.departmentId,
        currency: budget.currency,
        allocatedPaise: budget.allocatedPaise,
        committedPaise: budget.committedPaise,
        remainingPaise,
        allocated: budget.allocatedPaise / 100,
        committed: budget.committedPaise / 100,
        remaining: remainingPaise / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get budgets, optionally filtered by financial year
export const getBudgets = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.fiscalYear) {
      if (!/^\d{4}-\d{2}$/.test(req.query.fiscalYear)) {
        return res.status(400).json({
          success: false,
          message: "Fiscal year must be in YYYY-YY format",
        });
      }

      filter.fiscalYear = req.query.fiscalYear;
    }

    const budgets = await Budget.find(filter)
      .populate("departmentId", "name code")
      .sort({ fiscalYear: -1 })
      .lean();

    const data = budgets.map((budget) => ({
      ...budget,
      remainingPaise:
        budget.allocatedPaise - budget.committedPaise,
      allocated: budget.allocatedPaise / 100,
      committed: budget.committedPaise / 100,
      remaining:
        (budget.allocatedPaise - budget.committedPaise) / 100,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Create a budget. allocatedAmount is provided in rupees.
export const createBudget = async (req, res, next) => {
  try {
    const { departmentId, fiscalYear, allocatedAmount } = req.body;

    if (!departmentId || !mongoose.isValidObjectId(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "A valid departmentId is required",
      });
    }

    if (
      typeof fiscalYear !== "string" ||
      !/^\d{4}-\d{2}$/.test(fiscalYear) ||
      Number(fiscalYear.slice(5)) !==
        (Number(fiscalYear.slice(0, 4)) + 1) % 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Fiscal year must be valid, for example 2026-27",
      });
    }

    if (
      typeof allocatedAmount !== "number" ||
      !Number.isFinite(allocatedAmount) ||
      allocatedAmount <= 0 ||
      !Number.isSafeInteger(allocatedAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "allocatedAmount must be a positive amount in rupees with at most 2 decimal places",
      });
    }

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

    const budget = await Budget.create({
      departmentId,
      fiscalYear,
      allocatedPaise: Math.round(allocatedAmount * 100),
      committedPaise: 0,
      currency: "INR",
    });

    const populatedBudget = await Budget.findById(budget._id)
      .populate("departmentId", "name code")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: {
        ...populatedBudget,
        allocated: populatedBudget.allocatedPaise / 100,
        committed: 0,
        remaining: populatedBudget.allocatedPaise / 100,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A budget already exists for this department and fiscal year",
      });
    }

    next(error);
  }
};

// Update the allocation without changing committed spending
export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allocatedAmount } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    if (
      typeof allocatedAmount !== "number" ||
      !Number.isFinite(allocatedAmount) ||
      allocatedAmount <= 0 ||
      !Number.isSafeInteger(allocatedAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "allocatedAmount must be a positive amount in rupees with at most 2 decimal places",
      });
    }

    const budget = await Budget.findById(id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    const newAllocatedPaise = Math.round(allocatedAmount * 100);

    if (newAllocatedPaise < budget.committedPaise) {
      return res.status(400).json({
        success: false,
        message:
          "Allocation cannot be less than the already committed amount",
        committedPaise: budget.committedPaise,
      });
    }

    budget.allocatedPaise = newAllocatedPaise;
    await budget.save();

    await budget.populate("departmentId", "name code");

    return res.status(200).json({
      success: true,
      message: "Budget allocation updated successfully",
      data: {
        _id: budget._id,
        departmentId: budget.departmentId,
        fiscalYear: budget.fiscalYear,
        currency: budget.currency,
        allocatedPaise: budget.allocatedPaise,
        committedPaise: budget.committedPaise,
        remainingPaise:
          budget.allocatedPaise - budget.committedPaise,
        allocated: budget.allocatedPaise / 100,
        committed: budget.committedPaise / 100,
        remaining:
          (budget.allocatedPaise - budget.committedPaise) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};
