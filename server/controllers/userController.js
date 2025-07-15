// controllers/userController.js
import User from "../models/User.js";

// GET /api/auth/me
export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
};

// PUT /api/user/update
export const updateProfile = async (req, res) => {
  const { name, bio, image } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if ("image" in req.body) user.image = image;

  const updatedUser = await user.save();

  const sanitizedUser = updatedUser.toObject();
  delete sanitizedUser.password;

  res.json(sanitizedUser);
};