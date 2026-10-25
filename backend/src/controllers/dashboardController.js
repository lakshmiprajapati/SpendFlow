
import mongoose from "mongoose";
import User from "../models/User.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import Budget from "../models/Budget.js";

const getCurrentFiscalYear = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // Indian fiscal year: 1 April to 31 March.
  if (month >= 3) {
    return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
  }

  return `${year - 1}-${String(year % 100).padStart(2, "0")}`;
};

export const getEmployeeDashboard = async (req, res, next) => {
  try {
    const requesterId = new mongoose.Types.ObjectId(
      String(req.user._id)
    );

    const user = await User.findById(requesterId)
      .select("departmentId")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [summary, recentRequests, budget] = await Promise.all([
      PurchaseRequest.aggregate([
        { $match: { requesterId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      PurchaseRequest.find({ requesterId })
        .select("title totalAmountPaise status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      user.departmentId
        ? Budget.findOne({
            departmentId: user.departmentId,
            fiscalYear: getCurrentFiscalYear(),
          })
            .select(
              "departmentId fiscalYear allocatedPaise committedPaise currency"
            )
            .lean()
        : Promise.resolve(null),
    ]);

    const counts = {
      total: 0,
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const item of summary) {
      if (Object.hasOwn(counts, item._id) && item._id !== "total") {
        counts[item._id] = item.count;
      }

      counts.total += item.count;
    }

    const allocatedPaise = budget?.allocatedPaise ?? null;
    const committedPaise = budget?.committedPaise ?? null;

    const budgetData = budget
      ? {
          departmentId: budget.departmentId,
          fiscalYear: budget.fiscalYear,
          currency: budget.currency,
          allocatedPaise,
          committedPaise,
          remainingPaise: allocatedPaise - committedPaise,
          allocatedAmount: allocatedPaise / 100,
          committedAmount: committedPaise / 100,
          remainingAmount: (allocatedPaise - committedPaise) / 100,
        }
      : null;

    return res.status(200).json({
      success: true,
      summary: counts,
      budget: budgetData,
      recentRequests: recentRequests.map((request) => ({
        ...request,
        amount: request.totalAmountPaise / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getApproverDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "departmentId roles"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isApprover = (user.roles || []).some((role) =>
      ["manager", "departmentHead", "financeApprover"].includes(role)
    );

    if (!isApprover) {
      return res.status(403).json({
        message: "Only approvers can access this dashboard",
      });
    }

    const filter = { status: "pending_approval" };

    if (user.departmentId) {
      filter.departmentId = user.departmentId;
    }

    const [pendingCount, pendingRequests] = await Promise.all([
      PurchaseRequest.countDocuments(filter),

      PurchaseRequest.find(filter)
        .select(
          "requesterId departmentId title totalAmountPaise status createdAt"
        )
        .populate("requesterId", "name email")
        .sort({ createdAt: 1 })
        .limit(20)
        .lean(),
    ]);

    return res.status(200).json({
      pendingCount,
      pendingRequests: pendingRequests.map((request) => ({
        ...request,
        amount: request.totalAmountPaise / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};
