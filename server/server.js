// server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { startAuctionMonitor } from "./cron/auctionJob.js";

dotenv.config();

const app = express();

// 🧠 Place MIDDLEWARE FIRST
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Jewelry Bidding Platform API is live ✨");
});

app.get("/api/routes", (req, res) => {
  res.json({
    bids: [
      "/api/bids/",
      "/api/bids/my-bids",
      "/api/bids/product/:productId",
      "/api/bids/user/:userId"
    ]
  });
});
// 🛡️ Error Handlers
app.use(notFound);
app.use(errorHandler);

// 🚀 Connect to DB and Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    startAuctionMonitor(); // 🕒 Start Cron Jobs
  });
})
.catch((err) => console.error("❌ MongoDB connection error:", err));