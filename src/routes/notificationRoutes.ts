import express from "express";
import { protect } from "../middleware/auth/authMiddleware";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification/notificationController";

const router = express.Router();

router.get(
  "/",
  protect,
  getNotifications
);

router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

router.patch(
  "/read-all",
  protect,
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  protect,
  markNotificationRead
);

export default router;