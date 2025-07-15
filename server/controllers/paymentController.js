// controllers/paymentController.js
import crypto from "crypto";
import fs from "fs";
import path from "path";
import razorpay from "../utils/razorpay.js";
import Payment from "../models/Payment.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { generateInvoice } from "../utils/invoiceGenerator.js";

// POST /api/payments/create-order
export const createOrder = async (req, res) => {
  const { amount, bidId } = req.body;

  if (!razorpay) {
    return res.status(503).json({
      error: "Razorpay is not configured. Try again later.",
    });
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${bidId}_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  res.json({ orderId: order.id });
};

// POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bidId, amount } = req.body;

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpaySignature;

  if (isValid) {
    const payment = await Payment.create({
      bidId,
      amount,
      status: "success",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.status(201).json({ message: "Payment verified", payment });
  } else {
    res.status(400).json({ error: "Invalid signature" });
  }
};

// GET /api/payments/invoice/:paymentId
export const downloadInvoice = async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate("bidId");
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  const user = await User.findById(req.user._id);
  const product = await Product.findById(payment.bidId.productId);

  const fileName = `invoice_${payment._id}.pdf`;
  const filePath = path.join("invoices", fileName);

  // Ensure invoices folder exists
  if (!fs.existsSync("invoices")) {
    fs.mkdirSync("invoices");
  }

  generateInvoice(payment, user, product, filePath);

  // Delay a bit before sending to allow write
  setTimeout(() => {
    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath); // Clean up after sending
    });
  }, 1000);
};