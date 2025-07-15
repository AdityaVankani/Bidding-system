import express from "express";
import {
  placeBid,
  getBidsForProduct,
  getBidsByUser,
  getMyBids,
} from "../controllers/bidController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, placeBid);
router.get("/product/:productId", getBidsForProduct);
router.get("/user/:userId", protect, getBidsByUser);
router.get("/my-bids", protect, getMyBids);

export default router;