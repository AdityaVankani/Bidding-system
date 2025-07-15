// routes/userRoutes.js
import express from "express";
import { getMyProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/auth/me", protect, getMyProfile);
router.put("/update", protect, updateProfile);

export default router;