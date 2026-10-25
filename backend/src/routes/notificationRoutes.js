
import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes require authentication.
router.use(authenticate);

// Get the logged-in user's notifications.
router.get("/", getNotifications);

// Mark all notifications as read.
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read.
router.patch("/:id/read", markNotificationAsRead);

export default router;
