// controllers/dashboardController.js
import Product from "../models/Product.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";

// 🧾 GET /api/dashboard/my-bids - For customers
export const getMyBids = async (req, res) => {
  try {
    // Get all bids for the current user with product details
    const userBids = await Bid.aggregate([
      // Match user's bids
      {
        $match: {
          $or: [
            { bidderId: req.user._id },
            { bidder: req.user._id }
          ]
        }
      },
      // Sort by bid amount descending to process highest bid first
      { $sort: { bidAmount: -1 } },
      // Get product details
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      // Get the current highest bid for each product
      {
        $lookup: {
          from: "bids",
          let: { productId: "$product._id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$productId", "$product"] }
              }
            },
            { $sort: { bidAmount: -1 } },
            { $limit: 1 }
          ],
          as: "highestBid"
        }
      },
      {
        $addFields: {
          highestBid: { $arrayElemAt: ["$highestBid", 0] },
          currentTime: new Date()
        }
      },
      // Determine bid status for each bid
      {
        $project: {
          _id: 1,
          bidAmount: 1,
          bidTime: { $ifNull: ["$createdAt", new Date()] },
          // Status can be: 'winning', 'outbid', 'won', 'lost', 'pending'
          status: {
            $cond: [
              { $not: ["$product.isActive"] }, // If auction ended
              {
                $cond: [
                  { $eq: ["$bidAmount", "$highestBid.bidAmount"] },
                  "won",
                  "lost"
                ]
              },
              // If auction is still active
              {
                $cond: [
                  { $eq: ["$bidAmount", "$highestBid.bidAmount"] },
                  "winning",
                  "outbid"
                ]
              }
            ]
          },
          product: {
            _id: "$product._id",
            title: "$product.title",
            imageUrl: "$product.imageUrl",
            auctionEndTime: "$product.auctionEndTime",
            isActive: { $ifNull: ["$product.isActive", false] },
            highestBid: "$highestBid.bidAmount"
          }
        }
      },
      // Sort by bid time (most recent first)
      { $sort: { createdAt: -1 } }
    ]);

    res.json(userBids);
  } catch (err) {
    console.error("Error fetching customer bids:", err);
    res.status(500).json({ error: "Failed to fetch your bids." });
  }
};

// 📦 GET /api/dashboard/my-products - For sellers
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const currentTime = new Date();

    const productsWithAnalytics = await Promise.all(
      products.map(async (product) => {
        // Get all bids for this product
        const bids = await Bid.find({ product: product._id })
          .sort({ bidAmount: -1 })
          .populate('bidderId', 'name email')
          .lean();

        const bidCount = bids.length;
        const highestBid = bids[0];
        const uniqueBidders = [...new Set(bids.map(bid => bid.bidderId?._id.toString()))].length;
        
        // Calculate time remaining for active auctions
        let timeRemaining = null;
        if (product.isActive && product.auctionEndTime) {
          const endTime = new Date(product.auctionEndTime);
          const diffMs = endTime - currentTime;
          if (diffMs > 0) {
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemaining = `${days}d ${hours}h`;
          } else {
            // Auction should have ended
            await Product.findByIdAndUpdate(product._id, { isActive: false });
            product.isActive = false;
          }
        }

        // Calculate bid activity (bids in last 24 hours)
        const twentyFourHoursAgo = new Date(currentTime - 24 * 60 * 60 * 1000);
        const recentBidCount = bids.filter(
          bid => new Date(bid.createdAt) > twentyFourHoursAgo
        ).length;

        return {
          ...product,
          bidCount,
          highestBid: highestBid?.bidAmount || 0,
          highestBidder: highestBid?.bidderId || null,
          timeRemaining,
          recentBidCount,
          uniqueBidders,
          hasEnded: !product.isActive,
          currentPrice: highestBid?.bidAmount || product.startPrice,
          bidActivity: recentBidCount > 3 ? 'high' : recentBidCount > 0 ? 'medium' : 'low',
          daysActive: Math.ceil((currentTime - new Date(product.createdAt)) / (1000 * 60 * 60 * 24))
        };
      })
    );

    // Make sure we're using the correct variable name
    res.json(productsWithAnalytics);
  } catch (err) {
    console.error("Error fetching seller products:", err);
    res.status(500).json({ error: "Failed to fetch your products." });
  }
};

// 🏆 GET /api/dashboard/my-winners - For sellers
export const getWinners = async (req, res) => {
  try {
    const endedProducts = await Product.find({
      sellerId: req.user._id,
      isActive: false,
    });

    const results = [];

    for (const product of endedProducts) {
      const topBid = await Bid.find({ productId: product._id })
        .sort({ bidAmount: -1 })
        .limit(1)
        .populate("bidderId", "name email");

      if (topBid.length > 0) {
        results.push({
          product: {
            title: product.title,
            imageUrl: product.imageUrl,
          },
          winningBid: topBid[0],
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching winners:", err);
    res.status(500).json({ error: "Failed to fetch winning bids." });
  }
};

// 📊 GET /api/dashboard/analysis - For customers
export const getCustomerAnalysis = async (req, res) => {
  try {
    // Get user's total bids count and amount
    const userBids = await Bid.aggregate([
      { $match: { bidderId: req.user._id } },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" },
          avgBidAmount: { $avg: "$bidAmount" },
          maxBid: { $max: "$bidAmount" },
          minBid: { $min: "$bidAmount" }
        }
      }
    ]);

    // Get user's winning bids
    const wonProducts = await Product.aggregate([
      {
        $match: {
          isActive: false,
          highestBidId: { $exists: true }
        }
      },
      {
        $lookup: {
          from: "bids",
          localField: "highestBidId",
          foreignField: "_id",
          as: "winningBid"
        }
      },
      { $unwind: "$winningBid" },
      {
        $match: { "winningBid.bidderId": req.user._id }
      },
      {
        $project: {
          title: 1,
          imageUrl: 1,
          winningBid: {
            amount: "$winningBid.bidAmount",
            time: "$winningBid.bidTime"
          },
          auctionEndTime: 1
        }
      }
    ]);

    // Get bidding activity over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activity = await Bid.aggregate([
      {
        $match: {
          bidderId: req.user._id,
          bidTime: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$bidTime" } },
          count: { $sum: 1 },
          totalAmount: { $sum: "$bidAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get most active categories (if categories are implemented)
    const categoryStats = await Product.aggregate([
      {
        $lookup: {
          from: "bids",
          localField: "_id",
          foreignField: "productId",
          as: "bids"
        }
      },
      { $unwind: "$bids" },
      {
        $match: { "bids.bidderId": req.user._id }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalSpent: { $sum: "$bids.bidAmount" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const analysis = {
      summary: userBids[0] || {
        totalBids: 0,
        totalAmount: 0,
        avgBidAmount: 0,
        maxBid: 0,
        minBid: 0
      },
      wonAuctions: wonProducts,
      activityOverTime: activity,
      categoryStats: categoryStats,
      successRate: userBids[0] ? 
        (wonProducts.length / userBids[0].totalBids * 100).toFixed(1) + '%' : '0%'
    };

    res.json(analysis);
  } catch (err) {
    console.error("Error in customer analysis:", err);
    res.status(500).json({ error: "Failed to generate customer analysis." });
  }
};