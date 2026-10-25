
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getDepartments } from "../controllers/departmentController.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("manager", "departmentHead", "financeApprover"),
  getDepartments
);

export default router;
