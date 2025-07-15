// routes/notificationRoutes.js
import express from "express";
import {
  sendNotification,
  getMyNotifications,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendNotification);           // POST /api/notifications
router.get("/", protect, getMyNotifications);          // GET /api/notifications (secure)
router.patch("/:id/read", protect, markNotificationAsRead);  // PATCH /api/notifications/:id/read

export default router;