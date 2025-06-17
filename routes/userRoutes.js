const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const { authenticateToken } = require("../middleware/auth")
const sgMail = require("@sendgrid/mail")
const pool = require("../config/database") // Import the centralized pool
require("dotenv").config()

console.log("userRoutes.js loaded successfully") // Debug log

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Password reset routes
router.post("/request-password-reset", async (req, res) => {
  console.log("Processing /request-password-reset for email:", req.body.email)
  const { email } = req.body
  try {
    const result = await pool.query("SELECT user_id, username FROM users WHERE email = $1", [email])
    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ error: "Email not found" })
    }

    const resetToken = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "15m" })

    const msg = {
      to: email,
      from: "gspeckiii@proton.me",
      subject: "Password Reset Request",
      text: `Click this link to reset your password: http://localhost:3000/reset-password?token=${resetToken}`,
      html: `<p>Click <a href="http://localhost:3000/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    }

    console.log("Attempting to send email with token:", resetToken)
    const response = await sgMail.send(msg)
    console.log("Email sent, response:", response[0].statusCode, response[0].headers)
    res.json({ message: "Password reset email sent. Check your inbox." })
  } catch (error) {
    console.error("Request password reset error:", error.stack)
    console.log("Fallback error details:", error.response ? error.response.body : error.message)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/reset-password", async (req, res) => {
  console.log("Processing /reset-password with token:", req.body.token)
  const { token, newPassword } = req.body
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.user_id

    await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE user_id = $2", [newPassword, userId])

    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Reset password error:", error.stack)
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Reset token expired" })
    }
    res.status(400).json({ error: "Invalid or expired reset token" })
  }
})

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await pool.query("SELECT user_id, username FROM users WHERE username = $1 AND password = crypt($2, password)", [username, password])
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const token = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" })

    res.status(200).json({
      user_id: user.user_id,
      username: user.username,
      token: token
    })
  } catch (error) {
    console.error("Login error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
})

// User management routes (restore these)
const userController = require("../controllers/userController")
router.get("/users", authenticateToken, userController.getAllUsers)
router.get("/users/:id", authenticateToken, userController.getUserById)
router.post("/users", userController.createUser) // Remove authenticateToken if public registration
router.put("/users/:id", authenticateToken, userController.updateUser)
router.delete("/users/:id", authenticateToken, userController.deleteUser)

// Refresh token route
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const newToken = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.json({ token: newToken })
  } catch (error) {
    console.error("Refresh error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Change password route
router.put("/users/:id/change-password", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { currentPassword, newPassword } = req.body
  try {
    const userResult = await pool.query("SELECT password FROM users WHERE user_id = $1", [id])
    const user = userResult.rows[0]
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    const match = await pool.query("SELECT $1::text = crypt($2::text, password) AS match", [currentPassword, user.password])
    if (!match.rows[0].match) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }
    await pool.query("UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE user_id = $2", [newPassword, id])
    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
