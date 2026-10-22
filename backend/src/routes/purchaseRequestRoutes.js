
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import {
  createRequest,
  getMyRequests,
} from "../controllers/purchaseRequestController.js";

const router = Router();

router.post("/", authenticate, createRequest);
router.get("/", authenticate, getMyRequests);

export default router;
