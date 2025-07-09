// routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/auth.js");

// === THE FIX: Import and use the nested routers here ===
const orderItemRouter = require("./orderItemRoutes");
const paymentRouter = require("./paymentRoutes");

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
// Any request that matches "/orders/:orderId/items" will be handled by the orderItemRouter
router.use("/orders/:orderId/items", orderItemRouter);

// Any request that matches "/orders/:orderId/payments" will be handled by the paymentRouter
router.use("/orders/:orderId/payments", paymentRouter);

module.exports = router;
