// utils/razorpay.js
import Razorpay from "razorpay";

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
} else {
  console.warn("⚠️ Razorpay keys not found — payment features will be disabled.");
}

export default razorpay;