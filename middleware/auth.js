// spp-api/middleware/auth.js
const jwt = require("jsonwebtoken");
// Note: You only need require("dotenv").config() in your main server.js file.
// It loads the variables into the process, so it's not needed in other files.
// However, it doesn't hurt to have it here.

/**
 * Verifies the JWT token and attaches the user payload to req.user.
 * This should run first to identify the user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  // Use a try...catch block for synchronous error handling with jwt.verify
  try {
    // Verify the token using the secret key
    const user = jwt.verify(token, process.env.JWT_SECRET);

    // The decoded payload from the token is now attached to req.user
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // === THE KEY IMPROVEMENT IS HERE ===
    // Check if the error is specifically a TokenExpiredError
    if (err.name === "TokenExpiredError") {
      console.log("Authentication failed: Token has expired.");
      // Send a specific response (401 Unauthorized) that the frontend can identify
      return res.status(401).json({ error: "Token expired" });
    }

    // For any other verification error (e.g., malformed token, invalid signature),
    // send a generic Forbidden status.
    console.log("Authentication failed: Token is invalid.", err.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};

/**
 * Checks if the user attached by authenticateToken is an admin.
 * This should run *after* authenticateToken.
 */
const checkAdmin = (req, res, next) => {
  // req.user is expected to be populated by the authenticateToken middleware.
  if (req.user && req.user.admin === true) {
    // User is an admin, proceed.
    next();
  } else {
    // User is not an admin, or there's no user object.
    res
      .status(403)
      .json({ error: "Forbidden: Administrator access required." });
  }
};

// Export both functions
module.exports = { authenticateToken, checkAdmin };
