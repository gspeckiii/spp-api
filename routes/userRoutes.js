// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Import the correct, centralized middleware
const { authenticateToken } = require("../middleware/auth.js");

// --- PUBLIC ROUTES (No token required) ---
router.post("/users/login", userController.login);
router.post(
  "/users/request-password-reset",
  userController.requestPasswordReset
);
router.post("/users/reset-password", userController.resetPassword);
router.post("/users/checkRegUsername", userController.checkUsername);
router.post("/users/checkRegEmail", userController.checkEmail);
router.post("/users", userController.createUser);

// --- PROTECTED ROUTES (Token required) ---

// This middleware checks if the user making the request is the same as the user they are trying to modify.
const isSelf = (req, res, next) => {
  if (req.user.user_id !== parseInt(req.params.id)) {
    return res
      .status(403)
      .json({ error: "Forbidden: You can only modify your own account." });
  }
  next();
};

// Refresh token
router.post("/refresh", authenticateToken, userController.refreshToken);

// Get all users
router.get("/users", authenticateToken, userController.getAllUsers);

// Get a single user's public info
router.get("/users/:id", authenticateToken, userController.getUserById);

// Update a user (must be the user themselves)
router.put("/users/:id", authenticateToken, isSelf, userController.updateUser);

// Delete a user (must be the user themselves)
router.delete(
  "/users/:id",
  authenticateToken,
  isSelf,
  userController.deleteUser
);

// Change password (must be the user themselves)
router.post(
  "/users/:id/change-password",
  authenticateToken,
  isSelf,
  userController.changePassword
);

// Update refresh interval (must be the user themselves)
router.put(
  "/users/:id/refresh-interval",
  authenticateToken,
  isSelf,
  userController.setRefreshInterval
);

module.exports = router;
