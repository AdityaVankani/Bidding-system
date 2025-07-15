// pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Calculate time remaining in days and hours
const calculateTimeRemaining = (endTime) => {
  const now = new Date();
  const diffMs = endTime - now;
  if (diffMs <= 0) return null;
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Analysis Dashboard Component
const AnalysisDashboard = ({ analysis }) => {
  if (!analysis) return <div className="text-center py-10">Loading analysis...</div>;

  const { summary, wonAuctions, activityOverTime, categoryStats, successRate } = analysis;

  // Prepare data for charts
  const activityData = {
    labels: activityOverTime.map(item => item._id),
    datasets: [
      {
        label: 'Number of Bids',
        data: activityOverTime.map(item => item.count),
        borderColor: 'rgba(79, 70, 229, 1)',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Total Amount (₹)',
        data: activityOverTime.map(item => item.totalAmount / 1000), // Scale down for better visualization
        borderColor: 'rgba(220, 38, 38, 1)',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const categoryData = {
    labels: categoryStats.map(item => item._id || 'Uncategorized'),
    datasets: [
      {
        data: categoryStats.map(item => item.count),
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)',
          'rgba(220, 38, 38, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Bids</h3>
          <p className="text-3xl font-bold">{summary.totalBids}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Total Spent</h3>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Auctions Won</h3>
          <p className="text-3xl font-bold">{wonAuctions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Success Rate</h3>
          <p className="text-3xl font-bold">{successRate}</p>
        </div>
      </div>

      {/* Activity Over Time */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Bidding Activity (Last 30 Days)</h3>
        <div className="h-80">
          <Line 
            data={activityData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Number of Bids'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Total Amount (₹ thousands)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Bids by Category</h3>
          <div className="h-64">
            <Doughnut 
              data={categoryData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
        </div>

        {/* Recent Wins */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Recent Wins</h3>
          {wonAuctions.length === 0 ? (
            <p className="text-gray-500">No auction wins yet.</p>
          ) : (
            <div className="space-y-4">
              {wonAuctions.slice(0, 3).map((win, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                    {win.imageUrl && (
                      <img 
                        src={win.imageUrl} 
                        alt={win.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{win.title}</p>
                    <p className="text-sm text-gray-500">Won for {formatCurrency(win.winningBid.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [products, setProducts] = useState([]);
  const [winners, setWinners] = useState([]);
  const [role, setRole] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error('No token found, redirecting to login');
          navigate("/login");
          return;
        }

        console.log('Fetching user data...');
        const res = await axios.get("http://localhost:5002/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('User role:', res.data.role);
        setRole(res.data.role);

        if (res.data.role === "customer") {
          console.log('Fetching customer dashboard data...');
          try {
            console.log('Fetching bids and analysis data in parallel...');
            const [bidsRes, analysisRes] = await Promise.all([
              axios.get("http://localhost:5002/api/bids/my-bids", {
                headers: { Authorization: `Bearer ${token}` },
              }).catch(err => {
                console.error('Error fetching bids:', err.response?.data || err.message);
                throw err;
              }),
              axios.get("http://localhost:5002/api/dashboard/analysis", {
                headers: { Authorization: `Bearer ${token}` },
              }).catch(err => {
                console.error('Error fetching analysis:', err.response?.data || err.message);
                throw err;
              }),
            ]);
            
            console.log('Bids response status:', bidsRes.status);
            console.log('Raw bids data received:', bidsRes.data);
            
            if (!Array.isArray(bidsRes.data)) {
              console.error('Bids data is not an array:', bidsRes.data);
              console.log('Type of bids data:', typeof bidsRes.data);
              return;
            }
            
            console.log(`Received ${bidsRes.data.length} bids from API`);
            
            // Map the response to match the expected format
            const formattedBids = bidsRes.data.map((bid, index) => {
              console.log(`Processing bid ${index + 1}:`, bid);
              
              // Ensure product exists and has required fields
              const product = bid.product || {};
              const status = bid.status || 'unknown';
              
              return {
                ...bid,
                product: {
                  _id: product._id || bid.productId || `unknown-${index}`,
                  title: product.title || 'Unknown Product',
                  imageUrl: product.imageUrl || '/placeholder-product.jpg',
                  auctionEndTime: product.auctionEndTime || null,
                  isActive: product.isActive !== false,
                  highestBid: bid.currentHighestBid || bid.bidAmount || 0,
                  startPrice: product.startPrice || 0,
                  currentPrice: bid.currentHighestBid || bid.bidAmount || 0
                },
                bidTime: bid.bidTime || bid.createdAt || new Date(),
                isWinner: status === 'won',
                isWinning: status === 'winning',
                status: status
              };
            });
            
            console.log('Setting', formattedBids.length, 'bids');
            setBids(formattedBids);
            setAnalysis(analysisRes.data || {});
          } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (error.response) {
              console.error('Error response data:', error.response.data);
              console.error('Error status:', error.response.status);
              console.error('Error headers:', error.response.headers);
            } else if (error.request) {
              console.error('No response received:', error.request);
            } else {
              console.error('Error:', error.message);
            }
          }
        } else if (res.data.role === "seller") {
          const [productsRes, winnersRes] = await Promise.all([
            axios.get("http://localhost:5002/api/products/my-listed", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("http://localhost:5002/api/dashboard/my-winners", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          
          // Transform products data to match expected format
          const transformedProducts = productsRes.data.map(product => {
            // Get unique bidders
            const bidderIds = new Set();
            const bids = product.bids || [];
            
            // Count unique bidders and get recent bid count
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            let recentBidCount = 0;
            
            bids.forEach(bid => {
              if (bid.bidderId?._id) {
                bidderIds.add(bid.bidderId._id.toString());
              }
              if (new Date(bid.createdAt) > oneDayAgo) {
                recentBidCount++;
              }
            });
            
            // Get winner info if exists
            const winnerInfo = product.highestBidId?.bidderId ? {
              name: product.highestBidId.bidderId.name,
              email: product.highestBidId.bidderId.email,
              amount: product.highestBidId.bidAmount
            } : null;
            
            return {
              ...product,
              bidCount: bids.length,
              highestBid: product.highestBidId?.bidAmount || 0,
              timeRemaining: product.isActive && product.auctionEndTime ? 
                calculateTimeRemaining(new Date(product.auctionEndTime)) : null,
              uniqueBidders: bidderIds.size,
              recentBidCount,
              daysActive: Math.ceil((new Date() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24)),
              winner: winnerInfo
            };
          });
          
          setProducts(transformedProducts);
          setWinners(winnersRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard", err);
      }
    };

    fetchDashboard();
  }, []);

  // Debug: Log the bids data
  useEffect(() => {
    if (bids.length > 0) {
      console.log('Bids data:', bids);
      console.log('First bid details:', {
        bid: bids[0],
        hasProduct: !!bids[0]?.product,
        productKeys: bids[0]?.product ? Object.keys(bids[0].product) : 'No product data',
        bidKeys: Object.keys(bids[0] || {})
      });
    }
  }, [bids]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Your Dashboard</h1>
      </div>

      {role === "customer" && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("bids")}
                className={`${
                  activeTab === "bids"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Bids
              </button>
            </nav>
          </div>

          {activeTab === "overview" ? (
            <AnalysisDashboard analysis={analysis} />
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">🛍️ Your Bids</h2>
              {bids.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bids</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by placing a bid on an item.</p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      View Products
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Product
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Your Bid
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Current Price
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Bid Time
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {bids.map((bid) => {
                        // Safely access product data with fallbacks
                        const product = bid.product || {};
                        const bidAmount = bid.bidAmount || bid.amount || 0;
                        const bidTime = bid.bidTime || bid.createdAt || new Date();
                        const currentPrice = bid.currentHighestBid || product.highestBid || bidAmount;
                        const isAuctionActive = product.isActive !== false;
                        const status = bid.status || (() => {
                          if (!isAuctionActive) {
                            return bid.isWinner ? 'won' : 'lost';
                          }
                          return bid.isWinning ? 'winning' : 'outbid';
                        })();
                        
                        // Format bid time
                        const formattedBidTime = new Date(bidTime).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        // Format auction end time if available
                        const auctionEndTime = product.auctionEndTime ? new Date(product.auctionEndTime) : null;
                        const formattedAuctionEnd = auctionEndTime ? auctionEndTime.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A';
                        
                        // Get product title with fallback
                        const productTitle = product.title || 'Product not found';
                        
                        // Get product image URL with fallback
                        const productImage = product.imageUrl || '/placeholder-product.jpg';
                        
                        // Status badge configuration with tooltips
                        const statusConfig = {
                          winning: {
                            text: 'Winning',
                            description: 'Your bid is currently the highest',
                            bg: 'bg-green-50',
                            textColor: 'text-green-700',
                            icon: (
                              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414-1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                              </svg>
                            )
                          },
                          outbid: {
                            text: 'Outbid',
                            description: 'Someone has placed a higher bid',
                            bg: 'bg-yellow-50',
                            textColor: 'text-yellow-700',
                            icon: (
                              <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )
                          },
                          won: {
                            text: 'Won',
                            description: 'Congratulations! You won this auction',
                            bg: 'bg-blue-50',
                            textColor: 'text-blue-700',
                            icon: (
                              <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )
                          },
                          lost: {
                            text: 'Lost',
                            description: 'This auction has ended',
                            bg: 'bg-gray-100',
                            textColor: 'text-gray-700',
                            icon: (
                              <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )
                          },
                          pending: {
                            text: 'Pending',
                            description: 'Auction is still active',
                            bg: 'bg-gray-50',
                            textColor: 'text-gray-700',
                            icon: (
                              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )
                          }
                        };
                        
                        const statusInfo = statusConfig[status] || {
                          text: 'Active',
                          description: 'Auction is in progress',
                          bg: 'bg-blue-50',
                          textColor: 'text-blue-700',
                          icon: (
                            <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414-1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                          )
                        };
                        
                        return (
                          <tr key={bid._id} className="hover:bg-gray-50">
                            <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              <div className="flex items-center">
                                <div className="h-14 w-14 flex-shrink-0 mr-3 overflow-hidden rounded-md border border-gray-200">
                                  <img 
                                    className="h-full w-full object-cover" 
                                    src={productImage} 
                                    alt={productTitle} 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = '/placeholder-product.jpg';
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{productTitle}</div>
                                  {product.auctionEndTime && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {isAuctionActive ? (
                                        <span className="flex items-center">
                                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                          Ends {formattedAuctionEnd}
                                        </span>
                                      ) : (
                                        <span className="flex items-center">
                                          <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
                                          Ended {formattedAuctionEnd}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="font-medium text-gray-900">{formatCurrency(bidAmount)}</div>
                              <div className="text-xs text-gray-500">Your bid</div>
                              
                              {status === 'outbid' && (
                                <div className="mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                  Outbid by {formatCurrency(currentPrice - bidAmount)}
                                </div>
                              )}
                              
                              {status === 'winning' && (
                                <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                  {currentPrice > bidAmount ? 
                                    `Highest: ${formatCurrency(currentPrice)}` : 
                                    'You have the highest bid'}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="text-gray-900 font-medium">{formatCurrency(currentPrice)}</div>
                              <div className="text-xs text-gray-500">Current price</div>
                              
                              {status === 'outbid' && isAuctionActive && (
                                <button 
                                  className="mt-1 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-900"
                                  onClick={() => {
                                    navigate(`/products/${product._id || bid.product}`);
                                  }}
                                >
                                  Place higher bid →
                                </button>
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="inline-flex items-center">
                                <div className="group relative">
                                  <span 
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[status]?.bg || 'bg-gray-100'} ${statusConfig[status]?.textColor || 'text-gray-800'}`}
                                  >
                                    <span className="mr-1.5">{statusConfig[status]?.icon || 'ℹ️'}</span>
                                    {statusConfig[status]?.text || status}
                                  </span>
                                  <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 -ml-24 text-xs text-gray-600 bg-white border border-gray-200 rounded-md shadow-lg">
                                    {statusConfig[status]?.description || 'Bid status information'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <button
                                onClick={() => navigate(`/products/${product._id || bid.product}`)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                View Item
                                <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {role === "seller" && (
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {products.length}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Auctions</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {products.filter(p => p.isActive).length}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Bids</dt>
                <dd className="mt-1 text-3xl font-semibold text-blue-600">
                  {products.reduce((sum, p) => sum + (Array.isArray(p.bids) ? p.bids.length : 0), 0)}
                </dd>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                <dd className="mt-1 text-3xl font-semibold text-purple-600">
                  {formatCurrency(
                    products
                      .filter(p => !p.isActive && p.highestBid > 0)
                      .reduce((sum, p) => sum + p.highestBid, 0)
                  )}
                </dd>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">My Products</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Showing {products.length} {products.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="flex space-x-2">
                <select
                  className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filterStatus || 'all'}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bids</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Left</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products
                    .filter(product => {
                      if (filterStatus === 'active') return product.isActive;
                      if (filterStatus === 'ended') return !product.isActive;
                      return true;
                    })
                    .map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-md object-cover" src={product.imageUrl} alt={product.title} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.title}</div>
                              <div className="text-xs text-gray-500">
                                {Array.isArray(product.bids) ? 
                                  new Set(product.bids.map(bid => bid.bidderId?._id).filter(Boolean)).size : 0
                                } {Array.isArray(product.bids) && 
                                  new Set(product.bids.map(bid => bid.bidderId?._id).filter(Boolean)).size === 1 ? 'bidder' : 'bidders'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {product.isActive ? (
                              <>
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                                  Active
                                </span>
                                <span className={`text-xs ${product.recentBidCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                  {product.recentBidCount || 0} {product.recentBidCount === 1 ? 'bid' : 'bids'} in 24h
                                </span>
                              </>
                            ) : (
                              <div className="space-y-1">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 w-fit">
                                  {product.highestBid > 0 ? 'Sold' : 'Ended'}
                                </span>
                                {product.winner && (
                                  <div className="text-xs text-gray-600">
                                    <div>Winner: {product.winner.name}</div>
                                    <div className="text-green-600 font-medium">
                                      {formatCurrency(product.winner.amount)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.bidCount || 0}</div>
                          <div className="text-xs text-gray-500">
                            {product.uniqueBidders || 0} {product.uniqueBidders === 1 ? 'bidder' : 'bidders'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(product.highestBid || product.startPrice)}
                          </div>
                          {product.highestBid > 0 && (
                            <div className="text-xs text-green-600">
                              {product.highestBid > product.startPrice ? 'Above start' : 'At start'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.isActive ? (
                            product.timeRemaining ? (
                              <>
                                <div className="font-medium">{product.timeRemaining}</div>
                                <div className="text-xs text-gray-500">
                                  {product.daysActive} {product.daysActive === 1 ? 'day' : 'days'} active
                                </div>
                              </>
                            ) : (
                              <span className="text-yellow-600">Ending soon</span>
                            )
                          ) : (
                            <span className="text-gray-400">Ended {new Date(product.updatedAt).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/product/${product._id}`} 
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            View
                          </Link>
                          {product.isActive && (
                            <Link 
                              to={`/sell/edit/${product._id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Edit
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            {products.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new product.
                </p>
                <div className="mt-6">
                  <Link
                    to="/sell"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    New Product
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Auction Winners Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Auction Winners</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {products.filter(p => !p.isActive && p.highestBid > 0).length > 0 
                  ? `Showing ${products.filter(p => !p.isActive && p.highestBid > 0).length} ${products.filter(p => !p.isActive && p.highestBid > 0).length === 1 ? 'completed auction' : 'completed auctions'}` 
                  : 'No completed auctions yet'}
              </p>
            </div>
            {products.filter(p => !p.isActive && p.highestBid > 0).length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {products
                  .filter(p => !p.isActive && p.highestBid > 0)
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map((product) => {
                    const winner = product.highestBidId?.bidderId;
                    const endDate = new Date(product.updatedAt);
                    const formattedDate = endDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                    
                    return (
                      <li key={product._id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden mr-3">
                              <img 
                                className="h-full w-full object-cover" 
                                src={product.imageUrl || '/placeholder-product.jpg'} 
                                alt={product.title}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/placeholder-product.jpg';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                              {winner ? (
                                <p className="text-sm text-gray-500">
                                  Won by <span className="font-medium text-green-700">{winner.name}</span>
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500">No winning bid</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(product.highestBid)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ended {formattedDate}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No completed auctions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your completed auctions with winning bids will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;