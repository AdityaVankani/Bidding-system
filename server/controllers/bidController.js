// controllers/bidController.js
import Bid from "../models/Bid.js";
import Product from "../models/Product.js";

// POST /api/bids — place a new bid
export const placeBid = async (req, res) => {
  const { productId, bidAmount } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  if (new Date() > new Date(product.auctionEndTime)) {
    return res.status(400).json({ error: "Auction already ended" });
  }

  const highestBid = await Bid.find({ productId })
    .sort({ bidAmount: -1 })
    .limit(1);

  const currentHighest = highestBid[0]?.bidAmount || product.startPrice;
  const minIncrement = 500;

  if (bidAmount <= currentHighest) {
    return res.status(400).json({ error: `Bid must be higher than current (${currentHighest})` });
  }

  if (bidAmount - currentHighest < minIncrement) {
    return res.status(400).json({ error: `Bid must increase by at least ₹${minIncrement}` });
  }

  // ✅ Create the new bid
  const newBid = await Bid.create({
    productId,
    bidderId: userId,
    bidAmount,
    bidTime: new Date(),
  });

  // ✅ Update product's currentBid and highestBidId
  await Product.findByIdAndUpdate(
    productId,
    {
      currentBid: bidAmount,
      highestBidId: newBid._id,
    },
    { new: true }
  );

  res.status(201).json(newBid);
};

// GET /api/bids/product/:productId
export const getBidsForProduct = async (req, res) => {
  const bids = await Bid.find({ productId: req.params.productId })
    .sort({ bidAmount: -1 })
    .populate("bidderId", "name");
  res.json(bids);
};

// GET /api/bids/user/:userId
export const getBidsByUser = async (req, res) => {
  const bids = await Bid.find({ bidderId: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("productId", "title imageUrl auctionEndTime highestBidId");
  res.json(bids);
};

// GET /api/bids/my-bids
export const getMyBids = async (req, res) => {
  try {
    console.log('🔍 Fetching all bids for user:', req.user._id);
    const userId = req.user._id;
    
    // Convert string ID to ObjectId if needed
    const { Types } = await import('mongoose');
    const userIdObj = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    
    console.log('ℹ️ User ID as string:', userId);
    console.log('ℹ️ User ID as ObjectId:', userIdObj);
    
    // First, get all bids by the user
    console.log('🔍 Checking bids collection for user:', userId);
    const allBids = await Bid.aggregate([
      // Match all bids by this user using bidderId field
      {
        $match: {
          bidderId: userIdObj  // Using ObjectId for exact match
        }
      },
      { $addFields: { matchedBidderId: '$bidderId' } },
      // Sort by creation time (newest first)
      { $sort: { bidTime: -1 } },
      // Get product details for each bid
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      // Get the current highest bid for each product
      {
        $lookup: {
          from: "bids",
          let: { productId: "$productId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$productId", "$productId"] }
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
      // Format the response
      {
        $project: {
          _id: 1,
          bidAmount: 1,
          bidTime: 1,
          product: {
            _id: "$product._id",
            title: "$product.title",
            imageUrl: "$product.imageUrl",
            auctionEndTime: "$product.auctionEndTime",
            isActive: { 
              $and: [
                { $lte: ["$currentTime", "$product.auctionEndTime"] },
                { $eq: ["$product.status", "active"] }
              ]
            },
            startPrice: "$product.startPrice"
          },
          // Status can be: 'winning', 'outbid', 'won', 'lost'
          status: {
            $cond: [
              { $gt: ["$currentTime", "$product.auctionEndTime"] }, // If auction ended
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
          // Include the current highest bid amount
          currentHighestBid: "$highestBid.bidAmount"
        }
      }
    ]);

    console.log(`✅ Found ${allBids.length} total bids for user`);
    
    // Direct query to verify bids exist for this user
    const directBids = await Bid.find({ bidderId: userIdObj }).lean();
    console.log(`🔍 Direct query found ${directBids.length} bids for user`);
    
    if (directBids.length > 0) {
      console.log('🔍 First bid from direct query:', {
        _id: directBids[0]._id,
        bidderId: directBids[0].bidderId,
        productId: directBids[0].productId,
        bidAmount: directBids[0].bidAmount,
        bidTime: directBids[0].bidTime
      });
    }
    
    if (allBids.length > 0) {
      console.log('📋 Sample bid data:', {
        _id: allBids[0]._id,
        bidAmount: allBids[0].bidAmount,
        status: allBids[0].status,
        product: allBids[0].product,
        bidTime: allBids[0].bidTime,
        currentHighestBid: allBids[0].currentHighestBid
      });
    } else {
      console.log('ℹ️ No bids found for this user');
    }
    
    // Ensure we return an array even if empty
    res.json(allBids || []);
  } catch (err) {
    console.error("Error fetching my bids:", err);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};