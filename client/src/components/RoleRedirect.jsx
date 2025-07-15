// src/components/RoleRedirect.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const RoleRedirect = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("https://bidding-system-6vjf.onrender.com/api/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setRole(res.data.role);
      } catch (err) {
        console.error("Failed to fetch user for redirect", err);
        setRole("error");
      }
    };
    fetchUser();
  }, []);

  if (!role) return null;

  if (role === "seller") return <Navigate to={`/seller/${localStorage.getItem("userId")}`} />;
  if (role === "customer") return <Navigate to="/home" />;
  return <Navigate to="/login" />;
};

export default RoleRedirect;