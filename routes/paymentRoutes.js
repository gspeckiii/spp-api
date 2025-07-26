const express = require("express");
// We need `mergeParams: true` to access :orderId from the parent router
const router = express.Router({ mergeParams: true });
const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/auth.js");
const { checkOrderOwnership } = require("../controllers/orderItemController");

// Apply authentication and ownership checks to all routes in this file
router.use(authenticateToken);
router.use(checkOrderOwnership);

// GET /api/orders/:orderId/payments - Get all payment history for an order
router.get("/", paymentController.getOrderPayments);

// The POST route is removed from this file. It's now defined in orderRoutes.js.

module.exports = router;
