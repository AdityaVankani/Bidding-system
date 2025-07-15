// controllers/notificationController.js
import Notification from "../models/Notification.js";
import Product from "../models/Product.js";
import Bid from "../models/Bid.js";

// ✅ POST /api/notifications — Create a new notification
export const sendNotification = async (req, res) => {
  const { userId, message } = req.body;

  try {
    const notification = await Notification.create({ userId, message });
    res.status(201).json(notification);
  } catch (err) {
    console.error("Failed to send notification:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// ✅ GET /api/notifications — Get all notifications for logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    // Optional: auto-mark unread as read
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(notifications);
  } catch (err) {
    console.error("Failed to get notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// ✅ PATCH /api/notifications/:id/read — Mark one as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// ✅ Cron Job Hook — Send notification to winner + seller
export const notifyAuctionWinnerAndSeller = async (productId) => {
  try {
    const product = await Product.findById(productId)
      .populate("sellerId", "_id name")
      .populate({
        path: "highestBidId",
        populate: {
          path: "bidderId",
          select: "_id name",
        },
      });

    if (
      !product ||
      !product.sellerId ||
      !product.highestBidId ||
      !product.highestBidId.bidderId
    ) {
      console.warn(`Skipping notification for product ${productId} - missing data`);
      return;
    }

    const winnerId = product.highestBidId.bidderId._id;
    const winnerName = product.highestBidId.bidderId.name;
    const sellerId = product.sellerId._id;
    const productTitle = product.title;

    const winnerMessage = `🎉 You won the auction for "${productTitle}"!`;
    const sellerMessage = `🔔 Auction for "${productTitle}" ended. Winner: ${winnerName}`;

    await Notification.create([
      { userId: winnerId, message: winnerMessage },
      { userId: sellerId, message: sellerMessage },
    ]);

    console.log(`📩 Notifications sent for auction "${productTitle}"`);
  } catch (err) {
    console.error("❌ Error sending auction notifications:", err);
  }
};