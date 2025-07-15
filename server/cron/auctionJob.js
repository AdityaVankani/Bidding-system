// cron/auctionJob.js
import cron from "node-cron";
import Product from "../models/Product.js";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";

export const startAuctionMonitor = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("🕒 Running Auction Monitor...");

    const now = new Date();
    const endingProducts = await Product.find({
      auctionEndTime: { $lt: now },
      isActive: true,
    });

    for (const product of endingProducts) {
      const topBid = await Bid.find({ productId: product._id })
        .sort({ bidAmount: -1 })
        .limit(1)
        .populate("bidderId", "name");

      if (topBid.length > 0) {
        const winningBid = topBid[0];

        // ✅ Save highestBidId in product
        product.highestBidId = winningBid._id;

        // ✅ Notify Winner
        await Notification.create({
          userId: winningBid.bidderId._id,
          message: `🎉 You won the auction for "${product.title}". Proceed to payment.`,
        });

        // ✅ Notify Seller with Winner's name
        await Notification.create({
          userId: product.seller, // Assuming you store seller's ObjectId in product.seller
          message: `📢 Your auction "${product.title}" ended. Winner: ${winningBid.bidderId.name}`,
        });

        console.log(`🏆 Winner for "${product.title}": ${winningBid.bidderId.name}`);
      } else {
        // Notify seller: no winner
        await Notification.create({
          userId: product.seller,
          message: `⛔ Your auction "${product.title}" ended with no bids.`,
        });

        console.log(`❌ No bids placed for "${product.title}"`);
      }

      product.isActive = false;
      await product.save();
    }
  });
};