import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useEffect, useState } from "react";
import axios from "axios";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await axios.get("http://localhost:5002/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Navbar auth fetch error:", err);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-white/30 backdrop-blur-md shadow-md px-6 py-4 flex justify-between items-center fixed top-0 w-full z-50">
      <Link to="/" className="text-3xl font-serif font-bold text-yellow-700 tracking-widest">
        ElegantBid
      </Link>

      {user && (
        <div className="flex gap-6 items-center text-gray-800 font-medium">
          <Link to="/home" className="hover:text-yellow-700 hover:underline underline-offset-4">
            Home
          </Link>

          {/* 🔐 Dashboard Link for both roles */}
          <Link to="/dashboard" className="hover:text-yellow-700 hover:underline underline-offset-4">
            Dashboard
          </Link>

          {user.role === "customer" && (
            <>
              <Link to="/bidding-history" className="hover:text-yellow-700 hover:underline underline-offset-4">
                My Bids
              </Link>
              <NotificationBell unread={2} />
              <Link to="/profile" className="hover:text-yellow-700 hover:underline underline-offset-4">
                Profile
              </Link>
            </>
          )}

          {user.role === "seller" && (
            <>
              <Link to={`/seller/${user._id}`} className="hover:text-yellow-700 hover:underline underline-offset-4">
                My Listings
              </Link>
              <NotificationBell unread={2} />
              <Link to="/profile" className="hover:text-yellow-700 hover:underline underline-offset-4">
                Profile
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;