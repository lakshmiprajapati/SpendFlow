
import User from "../models/User.js";
import Budget from "../models/Budget.js";

export const getMyDepartmentBudget = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("departmentId");

    if (!user || !user.departmentId) {
      return res.status(404).json({
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
        message: "Budget not found for current financial year",
        fiscalYear,
      });
    }

    const remainingPaise =
      budget.allocatedPaise - budget.committedPaise;

    return res.status(200).json({
      fiscalYear: budget.fiscalYear,
      department: budget.departmentId,
      currency: budget.currency,
      allocatedPaise: budget.allocatedPaise,
      committedPaise: budget.committedPaise,
      remainingPaise,
      allocated: budget.allocatedPaise / 100,
      committed: budget.committedPaise / 100,
      remaining: remainingPaise / 100,
    });
  } catch (error) {
    next(error);
  }
};
