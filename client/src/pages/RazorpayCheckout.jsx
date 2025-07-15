import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const RazorpayCheckout = () => {
  const { bid: bidId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bid, setBid] = useState(null);
  const [product, setProduct] = useState({
    title: '',
    amount: 0,
    imageUrl: '/placeholder-product.jpg',
  });
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Bid ID from URL params:', bidId);
        
        // Validate bid ID
        if (!bidId) {
          const errorMsg = 'No valid bid ID provided. Please go back and try again.';
          console.error(errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found, redirecting to login');
          navigate('/login', { 
            state: { 
              from: location.pathname + location.search,
              message: 'Please log in to complete your payment' 
            } 
          });
          return;
        }

        // Fetch bid and product details
        const [bidResponse, userResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/bids/${bidId}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: { populate: 'product' }
          }).catch(err => {
            console.error('Error fetching bid:', err);
            throw new Error('Failed to load bid details. Please try again later.');
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/users/me`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }).catch(err => {
            console.error('Error fetching user:', err);
            throw new Error('Failed to load user details. Please try again later.');
          })
        ]);

        const bidData = bidResponse.data;
        const userData = userResponse.data;

        // Check if bid is already paid
        if (bidData.paid) {
          toast.info('This bid has already been paid for.');
          navigate('/bidding-history');
          return;
        }

        // Check if bid is won
        if (bidData.status !== 'won') {
          toast.error('This bid is not eligible for payment.');
          navigate('/bidding-history');
          return;
        }

        setBid(bidData);
        setUser({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        
        if (bidData.product) {
          setProduct({
            title: bidData.product.title,
            amount: bidData.bidAmount,
            imageUrl: bidData.product.images?.[0]?.url || '/placeholder-product.jpg',
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load payment details. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to bidding history if unauthorized or bid not found
        if (err.response?.status === 401 || err.response?.status === 404) {
          setTimeout(() => navigate('/bidding-history'), 2000);
        }
        
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  const handlePayment = async () => {
    if (!bid) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 1. Create an order on the server
      const token = localStorage.getItem('token');
      let orderResponse;
      try {
        orderResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/payments/create-order`,
          { 
            bidId: bid._id,
            amount: product.amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `order_${bid._id.slice(-6)}`
          },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 seconds timeout
          }
        );
      } catch (err) {
        console.error('Error creating order:', err);
        throw new Error(err.response?.data?.message || 'Failed to create payment order. Please try again.');
      }
      
      const { order } = orderResponse.data;
      
      // 2. Load Razorpay script with better error handling
      const isLoaded = await new Promise((resolve) => {
        // Declare timeout variable in the outer scope
        let timeout;
        
        try {
          // Check if already loaded
          if (window.Razorpay) {
            console.log('Razorpay already loaded');
            return resolve(true);
          }
          
          // Create script element
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.id = 'razorpay-script';
          
          // Handle script load and error
          const handleLoad = () => {
            if (timeout) clearTimeout(timeout);
            console.log('Razorpay script loaded successfully');
            resolve(true);
          };
          
          const handleError = (error) => {
            if (timeout) clearTimeout(timeout);
            console.error('Failed to load Razorpay script:', error);
            // Clean up the failed script
            const scriptElement = document.getElementById('razorpay-script');
            if (scriptElement) {
              scriptElement.remove();
            }
            resolve(false);
          };
          
          script.onload = handleLoad;
          script.onerror = handleError;
          
          // Add script to document
          document.body.appendChild(script);
          
          // Set a timeout in case the script never loads or calls the callback
          timeout = setTimeout(() => {
            if (!window.Razorpay) {
              console.error('Razorpay script loading timed out');
              const scriptElement = document.getElementById('razorpay-script');
              if (scriptElement) {
                scriptElement.remove();
              }
              resolve(false);
            }
          }, 10000); // 10 second timeout
          
        } catch (error) {
          console.error('Error loading Razorpay script:', error);
          resolve(false);
        }
      });
      
      if (!isLoaded) {
        throw new Error('Failed to load payment service. Please try again later.');
      }
      
      // 3. Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY',
        amount: order.amount,
        currency: order.currency,
        name: 'ElegantBid',
        description: `Payment for ${product.title}`,
        order_id: order.id,
        image: '/logo.png', // Your logo
        handler: async function (response) {
          try {
            // Show processing state
            toast.info('Verifying your payment...');
            
            // 4. Verify payment on the server
            const verifyResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/payments/verify`,
              {
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bidId: bid._id
              },
              { 
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout for verification
              }
            );
            
            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              // 5. Redirect to success page with transaction details
              navigate('/payment-success', { 
                state: { 
                  transactionId: response.razorpay_payment_id,
                  amount: order.amount / 100, // Convert back to actual amount
                  product: product.title,
                  date: new Date().toISOString()
                },
                replace: true
              });
            } else {
              throw new Error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast.error('Payment verification failed');
            navigate('/payment-failure', { 
              state: { 
                error: err.response?.data?.message || 'Payment verification failed. Please contact support with your transaction details.',
                bidId: bid._id,
                transactionId: response?.razorpay_payment_id
              },
              replace: true
            });
          }
        },
        prefill: {
          name: user.name || 'Customer',
          email: user.email || '',
          contact: user.phone || ''
        },
        notes: {
          bidId: bid._id,
          product: product.title
        },
        theme: {
          color: '#B59F5E',
          hide_topbar: false
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment was cancelled');
          },
          escape: true,
          confirm_close: true,
          handle_back: true
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        timeout: 900, // 15 minutes (900 seconds)
        remember_customer: true
      };
      
      // 6. Open Razorpay payment form
      const paymentObject = new window.Razorpay(options);
      
      // Handle payment errors
      paymentObject.on('payment.failed', function (response) {
        const error = response.error;
        console.error('Payment failed:', error);
        
        let errorMessage = 'Payment failed';
        if (error.code === 'PAYMENT_CANCELLED') {
          errorMessage = 'Payment was cancelled';
        } else if (error.code === 'NETWORK_ISSUE') {
          errorMessage = 'Network error occurred. Please check your connection and try again.';
        }
        
        toast.error(errorMessage);
        navigate('/payment-failure', { 
          state: { 
            error: errorMessage,
            bidId: bid._id,
            code: error.code
          },
          replace: true
        });
      });
      
      // Open the payment form
      paymentObject.open();
      
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to process payment. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If it's a bid-related error, redirect to bidding history
      if (err.response?.status === 400 || err.response?.status === 404) {
        setTimeout(() => navigate('/bidding-history'), 2000);
      }
      
      setLoading(false);
    }
  };

  if (loading && !error) {
    return (
      <div className="max-w-xl mx-auto mt-6 p-8 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-600"></div>
          <h3 className="text-xl font-semibold text-gray-800">Preparing Your Payment</h3>
          <p className="text-gray-600">Please wait while we connect to our secure payment gateway...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
            <div className="bg-yellow-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-6 p-8 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {error || 'An unexpected error occurred while processing your payment. Please try again.'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <button
              onClick={() => navigate('/bidding-history')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Back to Bids
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">Need help with your payment?</p>
            <a 
              href="mailto:support@elegantbid.com" 
              className="text-yellow-700 hover:underline text-sm font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 p-0 overflow-hidden bg-white/90 backdrop-blur-md shadow-xl rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold text-center">Secure Checkout</h1>
        <div className="flex items-center justify-center mt-2 space-x-2 text-yellow-100">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Product Summary */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3">
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>
            <p className="text-gray-600 mb-4">Auction Winning Bid</p>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Bid Amount</span>
                <span className="font-medium">₹{product.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Processing Fee</span>
                <span className="text-green-600 font-medium">₹0</span>
              </div>
              
              <div className="flex justify-between py-3 mt-4">
                <span className="text-lg font-semibold">Total Amount</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-700">₹{product.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Inclusive of all taxes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            Payment Method
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.1.5-.3 1-.8 1.1-.4.1-.9-.2-1-.7v-1.1c0-.5-.4-.9-.9-1h-.1c-.5 0-1 .4-1 1v3c0 .3.2.6.4.8l2 2c.2.2.4.3.7.3.6 0 1-.4 1-1 0-.3-.1-.5-.3-.7l-1.7-1.7V9.5c0-1.4 1.1-2.5 2.5-2.5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Credit/Debit Card</div>
                  <div className="text-xs text-gray-500">Pay securely using your card</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">••••</span>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">••••</span>
                </div>
                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">••••</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] ${
            loading
              ? 'bg-yellow-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Pay ₹{product.amount.toLocaleString()} Now
            </div>
          )}
        </button>

        {/* Security Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4 md:mb-0">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-600">100% Secure Payment</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Secured by</span>
              <div className="h-6">
                <svg className="h-full" viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30.5 5.5H33.5L31 9L28.5 5.5H31.5V3.5H28.5V2H33.5V5.5H30.5V7H28.5V5.5H30.5Z" fill="#0F172A"/>
                  <path d="M35.5 2H38.5V9H35.5V2Z" fill="#0F172A"/>
                  <path d="M40.5 2H43.5V9H40.5V2Z" fill="#0F172A"/>
                  <path d="M45.5 2H48.5V9H45.5V2Z" fill="#0F172A"/>
                  <path d="M50.5 2H53.5V9H50.5V2Z" fill="#0F172A"/>
                  <path d="M55.5 2H58.5V9H55.5V2Z" fill="#0F172A"/>
                  <path d="M60.5 2H63.5V9H60.5V2Z" fill="#0F172A"/>
                  <path d="M65.5 2H68.5V9H65.5V2Z" fill="#0F172A"/>
                  <path d="M70.5 2H73.5V9H70.5V2Z" fill="#0F172A"/>
                  <path d="M75.5 2H78.5V9H75.5V2Z" fill="#0F172A"/>
                  <path d="M0 2H3V9H0V2Z" fill="#0F172A"/>
                  <path d="M5 2H8V9H5V2Z" fill="#0F172A"/>
                  <path d="M10 2H13V9H10V2Z" fill="#0F172A"/>
                  <path d="M15 2H18V9H15V2Z" fill="#0F172A"/>
                  <path d="M20 2H23V9H20V2Z" fill="#0F172A"/>
                  <path d="M25 2H28V9H25V2Z" fill="#0F172A"/>
                  <path d="M30 2H33V9H30V2Z" fill="#0F172A"/>
                  <path d="M35 2H38V9H35V2Z" fill="#0F172A"/>
                  <path d="M40 2H43V9H40V2Z" fill="#0F172A"/>
                  <path d="M45 2H48V9H45V2Z" fill="#0F172A"/>
                  <path d="M50 2H53V9H50V2Z" fill="#0F172A"/>
                  <path d="M55 2H58V9H55V2Z" fill="#0F172A"/>
                  <path d="M60 2H63V9H60V2Z" fill="#0F172A"/>
                  <path d="M65 2H68V9H65V2Z" fill="#0F172A"/>
                  <path d="M70 2H73V9H70V2Z" fill="#0F172A"/>
                  <path d="M75 2H78V9H75V2Z" fill="#0F172A"/>
                  <path d="M0 12H3V19H0V12Z" fill="#0F172A"/>
                  <path d="M5 12H8V19H5V12Z" fill="#0F172A"/>
                  <path d="M10 12H13V19H10V12Z" fill="#0F172A"/>
                  <path d="M15 12H18V19H15V12Z" fill="#0F172A"/>
                  <path d="M20 12H23V19H20V12Z" fill="#0F172A"/>
                  <path d="M25 12H28V19H25V12Z" fill="#0F172A"/>
                  <path d="M30 12H33V19H30V12Z" fill="#0F172A"/>
                  <path d="M35 12H38V19H35V12Z" fill="#0F172A"/>
                  <path d="M40 12H43V19H40V12Z" fill="#0F172A"/>
                  <path d="M45 12H48V19H45V12Z" fill="#0F172A"/>
                  <path d="M50 12H53V19H50V12Z" fill="#0F172A"/>
                  <path d="M55 12H58V19H55V12Z" fill="#0F172A"/>
                  <path d="M60 12H63V19H60V12Z" fill="#0F172A"/>
                  <path d="M65 12H68V19H65V12Z" fill="#0F172A"/>
                  <path d="M70 12H73V19H70V12Z" fill="#0F172A"/>
                  <path d="M75 12H78V19H75V12Z" fill="#0F172A"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="bg-gray-50 p-6 border-t border-gray-200 rounded-b-2xl">
        <div className="flex flex-col items-center text-center">
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Need Help?</h3>
          <p className="text-gray-600 mb-4 max-w-md">
            Our customer support is available 24/7 to assist you with any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="mailto:support@elegantbid.com" 
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
            <a 
              href="tel:+911234567890" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +91 12345 67890
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckout;