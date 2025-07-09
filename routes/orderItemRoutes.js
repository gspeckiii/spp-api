// routes/orderItemRoutes.js

const express = require("express");
const router = express.Router({ mergeParams: true });
const orderItemController = require("../controllers/orderItemController");
const Order = require("../models/order");

// Import the correct, centralized middleware
const { authenticateToken } = require("../middleware/auth.js");

// Middleware for authorization (checking if the user owns the parent order)
const checkOrderOwnership = async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  try {
    const order = await Order.findById(orderId, userId);
    if (!order) {
      return res
        .status(404)
        .json({
          error:
            "Order not found or you do not have permission to access its items.",
        });
    }
    next();
  } catch (error) {
    console.error("Error checking order ownership:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

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
