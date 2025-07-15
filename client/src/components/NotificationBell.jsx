import { useEffect, useState } from "react";
import axios from "axios";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://localhost:5002/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        setError("Failed to load notifications.");
        console.error(err);
      }
    };

    fetchNotifications();
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-2 z-50 max-h-64 overflow-y-auto">
          {error && <p className="text-red-500 text-sm px-2">{error}</p>}
          {notifications.length === 0 ? (
            <p className="text-sm px-2 py-1 text-gray-500">No notifications</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n._id}
                className={`text-sm border-b p-2 last:border-none ${
                  !n.isRead ? "font-semibold text-gray-800" : "text-gray-600"
                }`}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;