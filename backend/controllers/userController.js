const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const MAX_BCRYPT_PASSWORD_BYTES = 72;
const PASSWORD_FAILURE_LIMIT = 5;
const PASSWORD_LOCKOUT_MS = 15 * 60 * 1000;
const passwordFailures = new Map();

const canAccessUser = (req, id) =>
  req.user?.role === "admin" || String(req.user?.id) === String(id);

const passwordFailureKey = (id) => String(id);

const recordPasswordFailure = (id) => {
  const now = Date.now();
  const key = passwordFailureKey(id);
  const attempts = passwordFailures.get(key);

  if (!attempts || attempts.expiresAt <= now) {
    passwordFailures.set(key, { count: 1, expiresAt: now + PASSWORD_LOCKOUT_MS });
    return false;
  }

  attempts.count += 1;
  return attempts.count >= PASSWORD_FAILURE_LIMIT;
};

// Get user by username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const userId = await User.findIdByUsername(username);
    if (!userId) return res.status(404).json({ message: "User not found" });
    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "User found",
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};


// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!canAccessUser(req, id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User found",
      user,
    });

  } catch (error) {
    console.error("Error finding user:", error.message);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Profile found", user });
  } catch (error) {
    console.error("Error loading profile:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateMyProfile = async (req, res) => {
  const fullName = req.body?.full_name;
  if (typeof fullName !== "string") {
    return res.status(400).json({ message: "Full name must be a string." });
  }

  const trimmedName = fullName.trim();
  const nameLength = [...trimmedName].length;
  if (nameLength < 3 || nameLength > 100) {
    return res.status(400).json({ message: "Full name must be between 3 and 100 characters." });
  }

  try {
    await User.updateFullName(req.user.id, trimmedName);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changeMyPassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  const userId = req.user.id;
  const attempts = passwordFailures.get(passwordFailureKey(userId));

  if (attempts?.expiresAt > Date.now() && attempts.count >= PASSWORD_FAILURE_LIMIT) {
    return res.status(429).json({ message: "Too many failed password attempts. Try again in 15 minutes." });
  }

  if ([currentPassword, newPassword, confirmPassword].some((value) => typeof value !== "string" || !value)) {
    return res.status(400).json({ message: "Current password, new password, and confirmation are required." });
  }
  if (Buffer.byteLength(newPassword, "utf8") > MAX_BCRYPT_PASSWORD_BYTES) {
    return res.status(400).json({ message: "New password exceeds bcrypt's 72-byte maximum." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({ message: "New password must be different from the current password." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Password confirmation does not match." });
  }

  try {
    const user = await User.findByUsername(req.user.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      const locked = recordPasswordFailure(userId);
      return res.status(locked ? 429 : 401).json({
        message: locked
          ? "Too many failed password attempts. Try again in 15 minutes."
          : "Current password is incorrect.",
      });
    }

    passwordFailures.delete(passwordFailureKey(userId));
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(userId, passwordHash);
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = {
  getUserByUsername,
  getUserById,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
