# Payment Integration Guide

This document provides instructions for setting up and using the Razorpay payment integration in the ElegantBid application.

## Prerequisites

1. Razorpay Account
   - Sign up at [Razorpay](https://razorpay.com/)
   - Go to Dashboard > Settings > API Keys
   - Generate API keys (Key ID and Key Secret)

2. Environment Variables
   - Update the `.env` file in the `client` directory with your Razorpay API keys:
     ```env
     VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
     VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret
     VITE_API_BASE_URL=http://localhost:5002/api
     ```

## Backend Setup

1. Install required packages:
   ```bash
   npm install razorpay crypto-js
   ```

2. Create a new file `server/utils/razorpay.js` with the following content:
   ```javascript
   const Razorpay = require('razorpay');
   const crypto = require('crypto');
   
   const razorpay = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID,
     key_secret: process.env.RAZORPAY_KEY_SECRET
   });
   
   exports.createOrder = async (amount, currency = 'INR', receipt) => {
     const options = {
       amount: amount * 100, // Convert to paise
       currency,
       receipt: receipt || `order_${Date.now()}`,
       payment_capture: 1
     };
   
     try {
       const order = await razorpay.orders.create(options);
       return { success: true, order };
     } catch (error) {
       console.error('Error creating Razorpay order:', error);
       return { success: false, error: error.message };
     }
   };
   
   exports.verifyPayment = async (orderId, paymentId, signature) => {
     const text = orderId + '|' + paymentId;
     const generatedSignature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
       .update(text)
       .digest('hex');
   
     return generatedSignature === signature;
   };
   ```

3. Create API endpoints in `server/routes/payments.js`:
   ```javascript
   const express = require('express');
   const router = express.Router();
   const { createOrder, verifyPayment } = require('../utils/razorpay');
   const Bid = require('../models/Bid');
   const auth = require('../middleware/auth');
   
   // Create Razorpay order
   router.post('/create-order', auth, async (req, res) => {
     try {
       const { bidId, amount, currency = 'INR' } = req.body;
       
       // Validate bid
       const bid = await Bid.findById(bidId)
         .populate('product', 'title')
         .populate('user', 'name email phone');
       
       if (!bid) {
         return res.status(404).json({ success: false, message: 'Bid not found' });
       }
       
       if (bid.paid) {
         return res.status(400).json({ success: false, message: 'This bid has already been paid for' });
       }
       
       if (bid.status !== 'won') {
         return res.status(400).json({ success: false, message: 'This bid is not eligible for payment' });
       }
       
       // Create order
       const receipt = `order_${bid._id.toString().slice(-6)}`;
       const { success, order, error } = await createOrder(amount, currency, receipt);
       
       if (!success) {
         return res.status(500).json({ success: false, message: error });
       }
       
       res.json({ success: true, order });
     } catch (error) {
       console.error('Error creating order:', error);
       res.status(500).json({ success: false, message: 'Server error' });
     }
   });
   
   // Verify payment and update bid status
   router.post('/verify', auth, async (req, res) => {
     try {
       const { orderId, paymentId, signature, bidId } = req.body;
       
       // Verify payment
       const isValid = await verifyPayment(orderId, paymentId, signature);
       
       if (!isValid) {
         return res.status(400).json({ success: false, message: 'Invalid payment signature' });
       }
       
       // Update bid status
       const bid = await Bid.findByIdAndUpdate(
         bidId,
         { 
           $set: { 
             paid: true,
             paymentId,
             paymentDate: new Date(),
             status: 'completed'
           } 
         },
         { new: true }
       );
       
       if (!bid) {
         return res.status(404).json({ success: false, message: 'Bid not found' });
       }
       
       // TODO: Send payment confirmation email
       
       res.json({ 
         success: true, 
         message: 'Payment verified successfully',
         payment: {
           id: paymentId,
           amount: bid.bidAmount,
           currency: 'INR',
           status: 'captured',
           orderId,
           bidId: bid._id
         }
       });
     } catch (error) {
       console.error('Error verifying payment:', error);
       res.status(500).json({ success: false, message: 'Server error' });
     }
   });
   
   module.exports = router;
   ```

## Frontend Components

### RazorpayCheckout Component
Handles the payment flow:
1. Fetches bid and user details
2. Creates a Razorpay order
3. Opens the Razorpay payment form
4. Verifies the payment
5. Redirects to success/failure pages

### PaymentSuccess Component
Shows order confirmation with:
- Transaction details
- Order summary
- Download invoice option
- Next steps

### PaymentFailure Component
Handles payment failures with:
- Error details
- Retry payment option
- Contact support with pre-filled details
- Back to dashboard option

## Testing

1. **Test Mode**
   - Use Razorpay's test credentials
   - Test card: `4111 1111 1111 1111`
   - Any future expiry date and CVV
   - OTP: `123456`

2. **Common Test Scenarios**
   - Successful payment
   - Payment failure (use test card `4000 0000 0000 0002`)
   - Network issues
   - Payment timeout
   - Browser back button

## Security Considerations

1. Never expose Razorpay key secret in client-side code
2. Always verify payment signature on the server
3. Use HTTPS in production
4. Implement rate limiting on payment endpoints
5. Log all payment-related activities

## Troubleshooting

1. **Payment not processing**
   - Check Razorpay dashboard for errors
   - Verify API keys and environment variables
   - Check network requests in browser dev tools

2. **Signature verification failed**
   - Ensure the same key secret is used for order creation and verification
   - Verify the order ID and payment ID match

3. **Order not found**
   - Check if the order was created in Razorpay dashboard
   - Verify the order ID is being passed correctly

## Support

For issues not covered in this guide, contact:
- Email: support@elegantbid.com
- Phone: +91-XXXXXXXXXX
- Razorpay Support: https://razorpay.com/support/
