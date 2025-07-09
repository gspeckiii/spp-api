// routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/auth.js");

// === THE FIX: Import and use the nested routers here ===
const orderItemRouter = require("./orderItemRoutes");
const paymentRouter = require("./paymentRoutes");
const fulfillmentRouter = require("./fulfillmentRoutes");

// --- Main Order Routes ---
router.post("/orders", authenticateToken, orderController.createOrder);
router.get("/orders", authenticateToken, orderController.getUserOrders);
router.get("/orders/:id", authenticateToken, orderController.getOrderById);
router.put(
  "/orders/:id/status",
  authenticateToken,
  orderController.updateOrderStatus
);
router.delete("/orders/:id", authenticateToken, orderController.deleteOrder);

// --- Nested Routes ---

router.use("/orders/:orderId/items", orderItemRouter);
router.use("/orders/:orderId/payments", paymentRouter);
router.use("/orders/:orderId/fulfillment", fulfillmentRouter);

module.exports = router;
