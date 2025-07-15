// routes/paymentRoutes.js
import express from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { downloadInvoice } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/invoice/:paymentId", protect, downloadInvoice);
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);

export default router;