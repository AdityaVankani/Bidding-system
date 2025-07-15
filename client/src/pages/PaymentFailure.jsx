import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PaymentFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [bidId, setBidId] = useState('');

  useEffect(() => {
    // Get error message from location state or default message
    const { error, bidId: bidParam } = location.state || {};
    setErrorMessage(error || 'Oops! Something went wrong while processing your payment.');
    setBidId(bidParam || '');
  }, [location.state]);

  const handleRetryPayment = () => {
    if (bidId) {
      navigate(`/razorpay-checkout?bid=${bidId}`);
    } else {
      window.location.reload();
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Payment Issue - Need Assistance');
    const body = encodeURIComponent(
      `Hello Support Team,\n\n` +
      `I'm having trouble with my payment for bid #${bidId || 'N/A'}.\n` +
      `Error details: ${errorMessage}\n\n` +
      `Please assist me with this issue.\n\n` +
      `Thank you,\n[Your Name]`
    );
    window.location.href = `mailto:support@elegantbid.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-xl mx-auto mt-6 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">✕</div>

        <h2 className="text-3xl font-serif font-bold text-gray-800 mb-3">
          Payment Unsuccessful
        </h2>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">What to do next?</h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                <p>• Check if the payment was deducted from your account</p>
                <p>• Verify your payment method details</p>
                <p>• Try again with a different payment method</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={handleRetryPayment}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={handleContactSupport}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </button>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-yellow-700 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;