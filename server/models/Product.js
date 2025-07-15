// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: String,
  description: String,
  imageUrl: String,
  startPrice: Number,
  currentBid: {
    type: Number,
    default: 0,
  },
  highestBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bid",
    default: null,
  },
  auctionEndTime: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model("Product", productSchema);