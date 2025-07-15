// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    amount: Number,
    status: { type: String, enum: ["success", "failed"], default: "success" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);