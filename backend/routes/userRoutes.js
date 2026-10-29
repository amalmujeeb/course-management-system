const express = require("express");

const router = express.Router();
const {
  getUserByUsername,
  getUserById,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} = require("../controllers/userController");
const roleMiddleware = require("../middleware/roleMiddleware");

// Own profile operations are available to every authenticated role.
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.put("/me/password", changeMyPassword);

// Legacy lookup endpoints remain available only to the account owner or an admin.
router.get("/username/:username", roleMiddleware(["admin", "student"]), getUserByUsername);
router.get("/:id", roleMiddleware(["admin", "student"]), getUserById);

module.exports = router;
