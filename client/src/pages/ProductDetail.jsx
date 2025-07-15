import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CountdownTimer from "../components/CountdownTimer";
import BidNowModal from "../components/BidNowModal";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const token = localStorage.getItem("token");

  const fetchProduct = async (timestamp = "") => {
  try {
    const res = await axios.get(`https://bidding-system-6vjf.onrender.com/api/products/${id}?t=${timestamp}`);
    setProduct(res.data);
  } catch (err) {
    console.error("Error fetching product:", err);
    setError("Failed to load product.");
  }
};

  useEffect(() => {
    fetchProduct();
  }, [id,successMessage]);

  const handleBidSubmit = async (amount) => {
    try {
      const res = await axios.post(
        "https://bidding-system-6vjf.onrender.com/api/bids",
        {
          productId: product._id,
          bidAmount: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Bid placed:", res.data);
      setSuccessMessage("✅ Bid placed successfully!");
      setError("");
      setShowModal(false);
      await fetchProduct(Date.now()); // Refresh product to update currentBid
    } catch (err) {
      const msg = err.response?.data?.error || "❌ Failed to place bid.";
      setError(msg);
      setSuccessMessage("");
      console.error("Bid submission error:", msg);
    }
  };

  if (error && !product) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="text-center mt-10">Loading product...</div>;
  }

  const displayBid = product.currentBid > 0 ? product.currentBid : product.startPrice;

  return (
    <div className="max-w-5xl mx-auto bg-white/60 backdrop-blur-sm shadow-xl p-6 rounded-2xl mt-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-xl overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-96 object-cover rounded-xl shadow-md"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-800 mb-3">
              {product.title}
            </h1>
            <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
            <p className="text-gray-600 mb-1">Start Price: ₹{product.startPrice}</p>
            <p className="text-lg text-gray-900 font-semibold">
              Current Bid: ₹{displayBid}
            </p>
            <CountdownTimer endTime={product.auctionEndTime} />
          </div>

          <button
            onClick={() => {
              setShowModal(true);
              setSuccessMessage("");
              setError("");
            }}
            className="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium transition"
          >
            Place a Bid
          </button>

          {successMessage && <p className="text-green-600 mt-3">{successMessage}</p>}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <BidNowModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onBidSubmit={handleBidSubmit}
        currentBid={displayBid}
        productId={product._id}
      />
    </div>
  );
};

export default ProductDetail;