
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authenticate } from "../middleware/authenticate.js";
import { login, getMe, demoLogin } from "../controllers/authController.js";

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

const demoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many demo login attempts. Please try again later.",
  },
});

router.post("/demo-login", demoLoginLimiter, demoLogin);

export default router;
