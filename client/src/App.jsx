import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import SellerProfile from "./pages/SellerProfile";
import CustomerProfile from "./pages/CustomerProfile";
import BiddingHistory from "./pages/BiddingHistory";
import Notifications from "./pages/Notifications";
import RazorpayCheckout from "./pages/RazorpayCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrivateRoute from "./components/PrivateRoute";
import RoleRedirect from "./components/RoleRedirect";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <main className="min-h-screen pt-24 px-6 pb-10 bg-gray-50">
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          {/* 🔁 Default route redirects to login */}
          <Route
            path="/"
            element={
              localStorage.getItem("token") ? (
                <RoleRedirect />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* 🔓 Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔐 Protected routes */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/auction/:id"
            element={
              <PrivateRoute>
                <ProductDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/seller/:id"
            element={
              <PrivateRoute>
                <SellerProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <CustomerProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/bidding-history"
            element={
              <PrivateRoute>
                <BiddingHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route 
            path="/razorpay-checkout/:bid"
            element={
              <PrivateRoute>
                <RazorpayCheckout />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <PrivateRoute>
                <PaymentSuccess />
              </PrivateRoute>
            }
          />
          <Route
            path="/payment-failure"
            element={
              <PrivateRoute>
                <PaymentFailure />
              </PrivateRoute>
            }
          />
          <Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;