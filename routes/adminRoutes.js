const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const fulfillmentController = require("../controllers/fulfillmentController");
const { authenticateToken, checkAdmin } = require("../middleware/auth.js"); // Import both

// Apply the middleware chain to all routes in this file.
// Any request to /api/admin/... will first check for a valid token, then check if the user is an admin.
router.use(authenticateToken);
router.use(checkAdmin);

// Route to get all orders in the system
// Full path: GET /api/admin/orders
router.get("/orders", orderController.adminGetOrders);

// Route to update a specific order's fulfillment details
// Full path: PUT /api/admin/orders/:orderId/fulfillment
router.put(
  "/orders/:orderId/fulfillment",
  fulfillmentController.adminUpdateFulfillment
);

module.exports = router;
