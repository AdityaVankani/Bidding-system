// src/pages/BiddingHistory.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from 'date-fns';

// Status configuration with icons and colors
const statusConfig = {
  won: {
    text: 'Won',
    icon: '🏆',
    bg: 'bg-green-50',
    textColor: 'text-green-700',
    description: 'Congratulations! You won this auction.'
  },
  lost: {
    text: 'Lost',
    icon: '❌',
    bg: 'bg-red-50',
    textColor: 'text-red-700',
    description: 'This auction has ended. Your bid was not the highest.'
  },
  ongoing: {
    text: 'In Progress',
    icon: '🔄',
    bg: 'bg-blue-50',
    textColor: 'text-blue-700',
    description: 'Auction is still in progress.'
  },
  winning: {
    text: 'Winning',
    icon: '👑',
    bg: 'bg-amber-50',
    textColor: 'text-amber-700',
    description: 'Your bid is currently the highest.'
  },
  outbid: {
    text: 'Outbid',
    icon: '⬆️',
    bg: 'bg-rose-50',
    textColor: 'text-rose-700',
    description: 'Your bid has been outbid by another user.'
  }
};

const BiddingHistory = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [bidsPerPage] = useState(10);

  const token = localStorage.getItem("token");

  const fetchBids = async () => {
    try {
      setLoading(true);
      console.log('Fetching bids with token:', token ? 'Token exists' : 'No token');
      
      const res = await axios.get("http://localhost:5002/api/bids/my-bids", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        params: {
          sort: '-createdAt',
          populate: 'product',
          limit: 100
        },
        withCredentials: true
      });

      console.log('Bids API Response:', res);
      
      if (!res.data) {
        console.error('No data in response');
        setError('No data received from server');
        return;
      }
      
      console.log('Setting bids:', res.data);
      setBids(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching bids:', err);
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         "Failed to fetch your bidding history. Please try again later.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBids();
    } else {
      setError("Please log in to view your bidding history.");
      setLoading(false);
    }
  }, [token]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date to a readable string with timezone handling
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Ensure the date is treated as UTC
      const date = new Date(dateString);
      // Format with timezone offset to get local time
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Determine status text and color based on bid data
  const getStatusInfo = (bid) => {
    // If the auction has ended
    const auctionEnded = new Date(bid.product?.auctionEndTime) < new Date();
    
    // Determine status based on bid amount and auction status
    let status;
    if (auctionEnded) {
      status = bid.bidAmount >= (bid.currentHighestBid || 0) ? 'won' : 'lost';
    } else {
      status = bid.bidAmount >= (bid.currentHighestBid || 0) ? 'winning' : 'outbid';
    }
    
    return statusConfig[status] || {
      text: 'Unknown',
      icon: '❓',
      bg: 'bg-gray-50',
      textColor: 'text-gray-700',
      description: 'Status unknown'
    };
  };

  // Get current bids
  const indexOfLastBid = currentPage * bidsPerPage;
  const indexOfFirstBid = indexOfLastBid - bidsPerPage;
  const currentBids = bids.slice(indexOfFirstBid, indexOfLastBid);
  const totalPages = Math.ceil(bids.length / bidsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Determine bid status
  const getBidStatus = (bid) => {
    if (!bid || !bid.product) return 'ongoing';
    
    const now = new Date();
    const auctionEndTime = new Date(bid.product.auctionEndTime);
    const isAuctionEnded = auctionEndTime < now;
    
    // Check if this is the highest bid
    const isHighestBid = bid.currentHighestBid 
      ? bid.bidAmount >= bid.currentHighestBid 
      : bid.product.highestBidId?.toString() === bid._id?.toString();
    
    if (isAuctionEnded) {
      return isHighestBid ? 'won' : 'lost';
    } else {
      return isHighestBid ? 'winning' : 'outbid';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mb-4"></div>
          <p className="text-gray-600">Loading your bidding history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    setError('');
                    setLoading(true);
                    fetchBids();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No bidding history</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't placed any bids yet.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/home')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Browse Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Your Bidding History</h1>
          <p className="mt-2 text-sm text-gray-600">
            A list of all your bids across all auctions.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Bid
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBids.map((bid) => {
                const status = getBidStatus(bid);
                const statusInfo = statusConfig[status] || statusConfig.ongoing;
                const product = bid.product || {};
                const currentPrice = bid.currentHighestBid || product.currentPrice || product.startPrice || 0;
                const isAuctionEnded = product.auctionEndTime && new Date(product.auctionEndTime) < new Date();
                
                return (
                  <tr key={bid._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img 
                            className="h-12 w-12 rounded-md object-cover border border-gray-200" 
                            src={bid.product?.imageUrl || '/placeholder-product.jpg'} 
                            alt={bid.product?.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{bid.product?.title || 'Product not found'}</div>
                          <div className="text-sm text-gray-500">Your bid: {formatCurrency(bid.bidAmount)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(bid.bidAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(bid.currentHighestBid || bid.product?.startPrice || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(bid.bidTime || bid.createdAt)}
                      </div>
                      {bid.product?.auctionEndTime && (
                        <div className="text-xs text-gray-500">
                          {new Date(bid.product.auctionEndTime) > new Date() 
                            ? `Ends ${formatDate(bid.product.auctionEndTime)}` 
                            : `Ended ${formatDate(bid.product.auctionEndTime)}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative group">
                        <span 
                          className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusInfo.bg} ${statusInfo.textColor}`}
                          title={statusInfo.description}
                        >
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 -ml-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-md shadow-lg">
                          {statusInfo.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => bid.product?._id && navigate(`/product/${bid.product._id}`)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          View
                        </button>
                        {status === 'won' && !bid.paid && (
                          <button
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                            onClick={() => navigate(`/razorpay-checkout/${bid._id}`)}
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstBid + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastBid, bids.length)}
                  </span>{' '}
                  of <span className="font-medium">{bids.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show page numbers around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-600 z-10'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiddingHistory;