
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMyDepartmentBudget } from "../controllers/budgetController.js";

const router = express.Router();

router.get("/my-department", authenticate, getMyDepartmentBudget);

export default router;
