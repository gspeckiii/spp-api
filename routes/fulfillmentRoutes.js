// routes/fulfillmentRoutes.js

const express = require("express");
// CRITICAL: mergeParams allows this router to access :orderId from the parent router
const router = express.Router({ mergeParams: true });
const fulfillmentController = require("../controllers/fulfillmentController");
const { authenticateToken } = require("../middleware/auth.js");
const { checkOrderOwnership } = require("../controllers/orderItemController"); // Reuse this excellent middleware

// Apply authentication and ownership checks to all routes in this file
router.use(authenticateToken);
router.use(checkOrderOwnership);

// Since there's only one fulfillment per order, the path is simply '/'
// It corresponds to the full URL: /api/orders/:orderId/fulfillment
router
  .route("/")
  .get(fulfillmentController.getFulfillment)
  .post(fulfillmentController.createFulfillment)
  .put(fulfillmentController.updateFulfillment);

module.exports = router;
