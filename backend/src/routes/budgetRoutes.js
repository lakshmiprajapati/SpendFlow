
import express from "express";
import {
  getMyDepartmentBudget,
  getBudgets,
  createBudget,
  updateBudget,
} from "../controllers/budgetController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Any authenticated user can view their own department's budget.
router.get("/my-department", authenticate, getMyDepartmentBudget);

// Managers, department heads and finance approvers can view all budgets.
router.get(
  "/",
  authenticate,
  authorize("manager", "departmentHead", "financeApprover"),
  getBudgets
);

// Only finance approvers can create budgets.
router.post(
  "/",
  authenticate,
  authorize("financeApprover"),
  createBudget
);

// Only finance approvers can update budget allocations.
router.patch(
  "/:id",
  authenticate,
  authorize("financeApprover"),
  updateBudget
);

export default router;
