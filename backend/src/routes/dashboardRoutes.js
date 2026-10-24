
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getEmployeeDashboard,
  getApproverDashboard,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/employee", authenticate, getEmployeeDashboard);
router.get("/approver", authenticate, getApproverDashboard);

export default router;
