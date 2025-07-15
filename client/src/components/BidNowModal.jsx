import { useState } from "react";

const BidNowModal = ({ show, onClose, onBidSubmit, currentBid }) => {
  const [amount, setAmount] = useState("");

  if (!show) return null;

  const handleSubmit = () => {
    if (Number(amount) <= currentBid) {
      alert("Your bid must be higher than the current bid!");
      return;
    }
    onBidSubmit(amount);
    setAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-all">
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl shadow-lg w-full max-w-md animate-fadeIn">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Place Your Bid</h2>
        <p className="text-gray-600 mb-2">Current Highest Bid: ₹{currentBid}</p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full border border-gray-300 px-4 py-2 rounded mb-4 focus:outline-yellow-600"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Confirm Bid
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidNowModal;