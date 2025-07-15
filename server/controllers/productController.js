import Product from "../models/Product.js";
import Bid from "../models/Bid.js";

// @POST /api/products
export const createProduct = async (req, res) => {
  const { title, description, imageUrl, startPrice, auctionEndTime } = req.body;

  try {
    const product = await Product.create({
      seller: req.user._id,
      title,
      description,
      imageUrl,
      startPrice,
      auctionEndTime,
      currentBid: startPrice,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// ✅ @GET /api/products — include currentBid dynamically
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ auctionEndTime: 1 });

    const productsWithBids = await Promise.all(
      products.map(async (product) => {
        const highestBid = await Bid.findOne({ productId: product._id })
          .sort({ bidAmount: -1 });

        return {
          ...product._doc,
          currentBid: highestBid?.bidAmount || product.startPrice,
        };
      })
    );

    res.json(productsWithBids);
  } catch (err) {
    console.error("Fetch all products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// @GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const highestBid = await Bid.findOne({ productId: product._id })
      .sort({ bidAmount: -1 });

    res.json({
      ...product._doc,
      currentBid: highestBid?.bidAmount || product.startPrice,
    });
  } catch (err) {
    console.error("Get product by ID error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// @GET /api/products/my-listed — populate winner and include bids count
export const getMyListedProducts = async (req, res) => {
  try {
    // Get all products for the seller
    const products = await Product.find({ seller: req.user._id })
      .populate({
        path: "highestBidId",
        populate: {
          path: "bidderId",
          select: "name email", // include winner details
        },
      });

    // For each product, get the bids count and add it to the product object
    const productsWithBids = await Promise.all(
      products.map(async (product) => {
        // Use productId to match the field in the Bid model
        const bidCount = await Bid.countDocuments({ productId: product._id });
        const bids = await Bid.find({ productId: product._id })
          .populate('bidderId', 'name email _id')
          .sort({ bidAmount: -1 });
        
        // Get unique bidders count
        const uniqueBidders = new Set();
        bids.forEach(bid => {
          if (bid.bidderId?._id) {
            uniqueBidders.add(bid.bidderId._id.toString());
          }
        });
        
        return {
          ...product.toObject(),
          bids: bids,
          bidCount,
          uniqueBidders: uniqueBidders.size
        };
      })
    );

    res.json(productsWithBids);
  } catch (err) {
    console.error("Error fetching listed products:", err);
    res.status(500).json({ error: "Failed to fetch your listed products" });
  }
};