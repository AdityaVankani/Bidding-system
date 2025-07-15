import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("https://bidding-system-6vjf.onrender.com/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        setError("Failed to fetch notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  if (loading) return <div className="text-center py-10">Loading notifications...</div>;
  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-6 p-6 bg-white/80 backdrop-blur-md shadow-xl rounded-2xl">
      <h2 className="text-3xl font-serif font-bold text-gray-800 mb-6">Notifications</h2>

      <ul className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500">You have no notifications.</p>
        ) : (
          notifications.map((n) => (
            <li
              key={n._id}
              className={`p-4 rounded-xl border-l-4 ${
                n.isRead
                  ? "border-gray-300 bg-white"
                  : "border-yellow-600 bg-yellow-50"
              } shadow-sm transition hover:shadow-md`}
            >
              <p className="text-gray-800 font-medium">{n.message}</p>
              <span className="text-xs text-gray-500">
                {moment(n.createdAt).fromNow()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Notifications;