
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";


import {
  createRequest,
  getMyRequests,
  getRequestById,
} from "../controllers/purchaseRequestController.js";


const router = Router();

router.post("/", authenticate, createRequest);
router.get("/", authenticate, getMyRequests);
router.get("/:id", authenticate, getRequestById);

export default router;
