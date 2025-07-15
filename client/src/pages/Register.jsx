// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5002/api/auth/register", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        })
      );
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#fbe7d0] to-[#f5f0eb]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Register</h2>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          className="input-box"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="input-box"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="input-box"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          className="input-box"
          value={formData.role}
          onChange={handleChange}
        >
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
        </select>

        <button
          type="submit"
          className="bg-yellow-600 text-white py-2 px-4 w-full rounded-lg hover:bg-yellow-700 mt-4"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-yellow-700 font-semibold hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
};

export default Register;