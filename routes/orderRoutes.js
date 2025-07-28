const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const paymentController = require("../controllers/paymentController"); // Import paymentController
const { authenticateToken } = require("../middleware/auth.js");
const { checkOrderOwnership } = require("../controllers/orderItemController"); // Import middleware

// === Import your nested routers ===
const orderItemRouter = require("./orderItemRoutes");
const paymentRouter = require("./paymentRoutes"); // This is the simplified one from above
const fulfillmentRouter = require("./fulfillmentRoutes");

router.put(
  "/orders/:orderId/cancel",
  authenticateToken,
  checkOrderOwnership, // Re-use middleware to ensure user owns the order
  orderController.cancelOrder
);

// --- Main Order Routes ---
router.post("/orders", authenticateToken, orderController.createOrder);
router.get("/orders", authenticateToken, orderController.getUserOrders);
// NEW - Consistent with other routes
router.get(
  "/orders/:orderId",
  authenticateToken,
  checkOrderOwnership,
  orderController.getOrderById
);
// ... other main routes

// --- NEW PAYMENT INTENT ROUTE ---
// Add the route for creating a Stripe Payment Intent. It's a specific action on an order.
router.post(
  "/orders/:orderId/create-payment-intent",
  authenticateToken,
  checkOrderOwnership,
  paymentController.createPaymentIntent
);

// --- Nested Resource Routes ---
// These routes handle collections of items related to an order.
router.use("/orders/:orderId/items", orderItemRouter);
router.use("/orders/:orderId/payments", paymentRouter); // Now correctly handles GET only
router.use("/orders/:orderId/fulfillment", fulfillmentRouter);

module.exports = router;
