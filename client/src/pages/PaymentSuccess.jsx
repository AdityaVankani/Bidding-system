import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { transactionId, amount, product } = location.state || {};
        
        if (!transactionId || !amount) {
          throw new Error('Invalid payment details');
        }

        // In a real app, you would fetch the order details from your API
        // For now, we'll use the data from location.state
        setOrder({
          title: product || 'Your Auction Item',
          transactionId,
          amount,
          date: new Date().toLocaleDateString(),
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please check your order history.');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state]);

  const handleDownloadInvoice = async () => {
    try {
      // In a real app, you would generate and download the invoice PDF
      // For now, we'll just show a success message
      alert('Invoice will be downloaded. In a real app, this would generate a PDF.');
      // window.open(invoiceUrl, '_blank');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-6 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-6 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-6 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl text-center">
      <div className="text-green-500 text-6xl mb-4">✓</div>

      <h2 className="text-3xl font-serif font-bold text-gray-800 mb-3">
        Payment Successful!
      </h2>

      <p className="text-gray-600 mb-6">
        Thank you for your payment. Your order has been confirmed.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-left mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Product:</span>
            <span className="font-medium">{order.title}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {order.transactionId}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{order.date}</span>
          </div>
          
          <div className="pt-3 mt-3 border-t border-gray-200">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Paid:</span>
              <span className="text-yellow-700">₹{order.amount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={handleDownloadInvoice}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Invoice
        </button>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 text-left rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">What's next?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• You will receive an order confirmation email with details.</p>
              <p>• Our team will process your order and contact you within 24-48 hours.</p>
              <p>• For any questions, contact our support at support@elegantbid.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;