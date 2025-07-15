// CustomerProfile.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const CustomerProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", bio: "", image: "" });
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        image: res.data.image || "",
      });
      setPhotoPreview(res.data.image || "");
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); 
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
   

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        data
      );
      const imageUrl = res.data.secure_url;
      setFormData({ ...formData, image: imageUrl });
      setPhotoPreview(imageUrl);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5002/api/user/update", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile.");
    }
  };

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md shadow-xl p-8 rounded-2xl mt-6">
      <h2 className="text-3xl font-serif font-bold text-gray-800 mb-6">Your Profile</h2>

      <div className="mb-8 bg-gray-100 p-6 rounded-lg">
        {photoPreview && (
          <div className="flex justify-center mb-4">
            <img
              src={photoPreview}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover border-2 border-yellow-600"
            />
          </div>
        )}
        <p className="text-lg font-semibold mb-2">
          👤 Name: <span className="font-normal">{user.name}</span>
        </p>
        <p className="text-lg font-semibold mb-2">
          📧 Email: <span className="font-normal">{user.email}</span>
        </p>
        <p className="text-lg font-semibold mb-2">
          🧩 Role: <span className="font-normal capitalize">{user.role}</span>
        </p>
        {user.bio && (
          <p className="text-lg font-semibold">
            📝 Bio: <span className="font-normal">{user.bio}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Update Profile
        </button>

        {message && (
          <p className="text-center text-green-600 text-sm mt-2">{message}</p>
        )}
      </form>
    </div>
  );
};

export default CustomerProfile;