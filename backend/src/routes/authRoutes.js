
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { login, getMe } from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post("/login", loginLimiter, login);
router.get("/me", authenticate, getMe);

export default router;
