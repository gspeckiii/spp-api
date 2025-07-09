// routes/paymentRoutes.js

const express = require("express");
// We need `mergeParams: true` to access :orderId from the parent router
const router = express.Router({ mergeParams: true });
const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/auth.js");
const { checkOrderOwnership } = require("../controllers/orderItemController"); // We can reuse this middleware

// Apply authentication and order ownership checks to all payment routes
router.use(authenticateToken);
router.use(checkOrderOwnership);

// GET /api/orders/:orderId/payments - Get all payment history for an order
// POST /api/orders/:orderId/payments - Create a new payment for an order
router
  .route("/")
  .get(paymentController.getOrderPayments)
  .post(paymentController.createPayment);

module.exports = router;
