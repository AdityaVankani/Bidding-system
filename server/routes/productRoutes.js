import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  getMyListedProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Seller-only routes
router.post("/", protect, createProduct);
router.get("/my-listed", protect, getMyListedProducts); // 🔥 New route

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

export default router;