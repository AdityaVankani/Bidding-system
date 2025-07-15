// routes/dashboardRoutes.js
import express from "express";
import {
  getMyBids,
  getMyProducts,
  getWinners,
  getCustomerAnalysis,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 For Customers
router.get("/my-bids", protect, getMyBids); // Shows customer bid history
router.get("/analysis", protect, getCustomerAnalysis); // Customer bidding analysis

// 🔐 For Sellers
router.get("/my-products", protect, getMyProducts); // All products uploaded by seller
router.get("/my-winners", protect, getWinners);     // Ended auctions & winner info

export default router;