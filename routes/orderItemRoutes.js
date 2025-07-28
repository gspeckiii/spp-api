// routes/orderItemRoutes.js

const express = require("express");
const router = express.Router({ mergeParams: true });
const orderItemController = require("../controllers/orderItemController");
const Order = require("../models/order");
const { checkOrderOwnership } = require("../controllers/orderItemController"); // Import middleware
// Import the correct, centralized middleware
const { authenticateToken } = require("../middleware/auth.js");

// Middleware for authorization (checking if the user owns the parent order)
// In the file where checkOrderOwnership is defined (e.g., controllers/orderItemController.js)

// --- CRUD Routes for Order Items ---
// Each route is now individually protected with a chain of middleware.

router
  .route("/")
  .get(
    authenticateToken,
    checkOrderOwnership,
    orderItemController.getAllOrderItems
  )
  .post(
    authenticateToken,
    checkOrderOwnership,
    orderItemController.addOrderItem
  );

router
  .route("/:itemId")
  .put(
    authenticateToken,
    checkOrderOwnership,
    orderItemController.updateOrderItem
  )
  .delete(
    authenticateToken,
    checkOrderOwnership,
    orderItemController.deleteOrderItem
  );

module.exports = router;
