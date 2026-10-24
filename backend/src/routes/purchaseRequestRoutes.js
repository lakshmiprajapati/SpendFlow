
import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";


import {
  createRequest,
  getMyRequests,
  getRequestById,
  updateDraftRequest,
  submitRequest,
  getManagerPendingApprovals,
  decideRequest,
  resubmitRequest,
} from "../controllers/purchaseRequestController.js";



const router = Router();

router.post("/", authenticate, createRequest);
router.get("/", authenticate, getMyRequests);
router.get(
  "/pending-approval",
  authenticate,
  getManagerPendingApprovals
);
router.get("/:id", authenticate, getRequestById);
router.patch("/:id", authenticate, updateDraftRequest);
router.post("/:id/submit", authenticate, submitRequest);
router.post("/:id/decision", authenticate, decideRequest);
router.post("/:id/resubmit", authenticate, resubmitRequest);


export default router;
