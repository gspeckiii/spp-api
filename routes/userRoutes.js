const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const userController = require("../controllers/userController")

console.log("userRoutes.js loaded successfully")

// Password reset and authentication routes
router.post("/request-password-reset", userController.requestPasswordReset) // Public
router.post("/reset-password", userController.resetPassword) // Public, uses token from body
router.post("/login", userController.login)
router.post("/refresh", authenticateToken, userController.refreshToken)
router.put("/users/:id/change-password", authenticateToken, userController.changePassword)

// User management routes
router.get("/users", authenticateToken, userController.getAllUsers)
router.get("/users/:id", authenticateToken, userController.getUserById)
router.post("/users", userController.createUser) // Remove authenticateToken if public registration
router.put("/users/:id", authenticateToken, userController.updateUser)
router.delete("/users/:id", authenticateToken, userController.deleteUser)

module.exports = router
