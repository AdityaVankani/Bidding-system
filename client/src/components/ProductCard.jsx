import { Link } from "react-router-dom";
import CountdownTimer from "./CountdownTimer";

const ProductCard = ({ product }) => {
  const auctionEnded = new Date(product.auctionEndTime) < new Date();

  const winnerName =
    product.highestBidId?.bidderId?.name || "No winner";

  return (
    <div className="bg-white/60 backdrop-blur-sm shadow-xl border border-gray-200 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
      <div className="relative h-64 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-3">
          <h3 className="text-lg font-semibold">{product.title}</h3>
          <p className="text-sm">Current Bid: ₹{product.currentBid}</p>

          {auctionEnded ? (
            <p className="text-xs mt-1">
              🏁 Auction ended —{" "}
              <span className="font-semibold">
                Winner: {winnerName}
              </span>
            </p>
          ) : (
            <CountdownTimer endTime={product.auctionEndTime} dark />
          )}
        </div>
      </div>

      <div className="p-4">
        <Link
          to={`/auction/${product._id}`}
          className={`block w-full text-center ${
            auctionEnded
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          } text-white font-medium py-2 rounded-lg transition`}
        >
          {auctionEnded ? "Auction Ended" : "Bid Now"}
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;