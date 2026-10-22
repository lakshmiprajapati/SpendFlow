
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import { createRequest } from "../controllers/purchaseRequestController.js";

const router = Router();

router.post("/", authenticate, createRequest);

export default router;
