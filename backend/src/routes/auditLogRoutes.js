
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getAuditLogs } from "../controllers/auditLogController.js";

const router = express.Router();

// Only managers and finance approvers can access audit logs.
router.get(
  "/",
  authenticate,
  authorize("manager", "financeApprover"),
  getAuditLogs
);

export default router;
