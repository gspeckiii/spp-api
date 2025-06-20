const User = require("../models/user")
const sgMail = require("@sendgrid/mail")
const jwt = require("jsonwebtoken")
const pool = require("../config/database")
require("dotenv").config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

exports.login = async (req, res) => {
  const { username, password } = req.body
  try {
    console.log("Attempting login for username:", username)
    const user = await User.findByUsername(username)
    console.log("Fetched user:", user)
    if (!user) {
      console.log("User not found for username:", username)
      return res.status(401).json({ error: "Invalid username or password" })
    }
    if (!user.password) {
      console.error("User object missing password field:", user)
      return res.status(500).json({ error: "Internal server error: Password field missing" })
    }

    const isValidPassword = await User.verifyPassword(username, password)
    console.log("Password match result:", isValidPassword)
    if (!isValidPassword) {
      console.log("Invalid password for username:", username, "Provided password:", password)
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const token = jwt.sign({ user_id: user.user_id, username: user.username, admin: user.admin }, process.env.JWT_SECRET, { expiresIn: "1h" })
    console.log("Generated token for user:", username)

    res.status(200).json({
      user_id: user.user_id,
      username: user.username,
      admin: user.admin,
      token: token
    })
  } catch (error) {
    console.error("Login error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.requestPasswordReset = async (req, res) => {
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
      text: `Click this link to reset your password: http://localhost:8080/reset-password?token=${resetToken}`,
      html: `<p>Click <a href="http://localhost:8080/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    }

    console.log("Attempting to send email with token:", resetToken)
    const response = await sgMail.send(msg)
    console.log("Email sent, response:", response[0].statusCode, response[0].headers)
    res.json({ message: "Password reset email sent. Check your inbox.", token: resetToken })
  } catch (error) {
    console.error("Request password reset error:", error.stack)
    console.log("Fallback error details:", error.response ? error.response.body : error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body
  try {
    console.log("Attempting to reset password with token:", token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Decoded token:", decoded)
    const userId = decoded.user_id
    console.log("Fetching user with ID:", userId)
    const user = await User.findById(userId)
    if (!user) {
      console.log("User not found for ID:", userId)
      return res.status(404).json({ error: "User not found" })
    }

    console.log("Updating password for user:", user.username)
    await User.update(userId, { password: newPassword })
    console.log("Password reset successful for user:", user.username)
    res.json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Reset password error:", error.stack)
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Reset token expired" })
    }
    res.status(500).json({ error: "Invalid or expired reset token" })
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const user = req.user
    const newToken = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" })
    res.json({ token: newToken })
  } catch (error) {
    console.error("Refresh error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.changePassword = async (req, res) => {
  const { id } = req.params
  const { currentPassword, newPassword } = req.body
  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    const isValidPassword = await User.verifyPassword(user.username, currentPassword)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" })
    }
    await User.update(id, { password: newPassword })
    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll()
    res.json(users)
  } catch (error) {
    console.error("Error in getAllUsers:", error.stack)
    res.status(500).json({ error: "Internal server error", details: error.message })
  }
}

exports.checkUsername = async (req, res) => {
  try {
    console.log(`Controller received: ${JSON.stringify(req.body)}`)
    const { username } = req.body
    if (!username || typeof username !== "string" || username.trim() === "") {
      return res.status(400).json({ error: "Username is required and must be a non-empty string" })
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be between 3 and 30 characters" })
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters and numbers" })
    }
    const user = await User.findByUsername(username)
    console.log(`checkUsername result: ${JSON.stringify(user)}`)
    res.status(200).json(user) // Return null for not found
  } catch (error) {
    console.error("Check username error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.checkEmail = async (req, res) => {
  try {
    console.log(`Controller received: ${JSON.stringify(req.body)}`)
    const { email } = req.body
    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ error: "Email is required and must be a non-empty string" })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }
    const user = await User.findByEmail(email)
    console.log(`checkEmail result: ${JSON.stringify(user)}`)
    res.status(200).json(user ? true : false) // Return true/false like course
  } catch (error) {
    console.error("Check email error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    res.status(200).json(user) // Return null for not found
  } catch (error) {
    console.error("Get user by ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.createUser = async (req, res) => {
  try {
    console.log(`Creating user with data: ${JSON.stringify(req.body)}`)
    const user = await User.create(req.body)
    res.status(201).json(user)
  } catch (error) {
    console.error("Create user error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const user = await User.update(req.params.id, req.body)
    res.status(200).json(user) // Return null for not found
  } catch (error) {
    console.error("Update user error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.delete(req.params.id)
    res.status(200).json(user ? { message: "User deleted" } : null) // Align with course
  } catch (error) {
    console.error("Delete user error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = exports
