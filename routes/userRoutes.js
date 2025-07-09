const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    console.log("No token provided in request")
    return res.status(401).json({ error: "No token provided" })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Decoded token:", decoded)
    req.user = decoded
    next()
  } catch (error) {
    console.error("Token verification error:", error.stack)
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

router.post("/users/login", userController.login)
router.post("/users/request-password-reset", userController.requestPasswordReset)
router.post("/users/reset-password", userController.resetPassword)
router.post("/refresh", verifyToken, userController.refreshToken)
// This is the new, correct route
router.post("/users/checkRegUsername", userController.checkUsername)
// Corrected route
router.post("/users/checkRegEmail", userController.checkEmail)
router.get("/users", userController.getAllUsers)
router.get("/users/:id", userController.getUserById)
router.post("/users", userController.createUser)
router.put("/users/:id", userController.updateUser)
router.delete("/users/:id", userController.deleteUser)
router.post("/users/:id/change-password", userController.changePassword)
router.put(
  "/users/:id/refresh-interval",
  verifyToken,
  (req, res, next) => {
    console.log("PUT /users/:id/refresh-interval, req.user:", req.user, "req.params.id:", req.params.id)
    if (req.user.user_id !== parseInt(req.params.id)) {
      console.log("Unauthorized: req.user.user_id does not match req.params.id")
      return res.status(403).json({ error: "Unauthorized: You can only update your own refresh interval" })
    }
    next()
  },
  userController.setRefreshInterval
)

module.exports = router
