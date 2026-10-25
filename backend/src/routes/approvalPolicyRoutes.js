
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import {
  getApprovalPolicies,
  createApprovalPolicy,
  updateApprovalPolicy,
} from "../controllers/approvalPolicyController.js";

const router = express.Router();

// Managers and finance approvers can view policies.
router.get(
  "/",
  authenticate,
  authorize("manager", "financeApprover"),
  getApprovalPolicies
);

// Only finance approvers can create or modify policies.
router.post(
  "/",
  authenticate,
  authorize("financeApprover"),
  createApprovalPolicy
);

router.patch(
  "/:id",
  authenticate,
  authorize("financeApprover"),
  updateApprovalPolicy
);

export default router;
