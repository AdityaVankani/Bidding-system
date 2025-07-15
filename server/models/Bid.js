// models/Bid.js
import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    bidderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bidAmount: { type: Number, required: true },
    bidTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Bid", bidSchema);