// controllers/orderController.js

const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const Product = require("../models/product");
/**
 * Creates a new order.
 */
exports.createOrder = async (req, res) => {
  const { items, total_amount } = req.body;
  const user_id = req.user.user_id; // From auth middleware

  if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res.status(400).json({
      error: "Missing required fields: items array and total_amount.",
    });
  }

  try {
    const newOrder = await Order.create(user_id, items, total_amount);
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error while creating order." });
  }
};

/**
 * Fetches detailed orders for the logged-in user based on a status query.
 * This is the correct version needed for the ProfileOrder component.
 */
exports.getUserOrders = async (req, res) => {
  const user_id = req.user.user_id;
  const { status } = req.query; // e.g., ?status=open or ?status=closed

  try {
    const orders = await Order.findDetailedOrdersByUserId(user_id, status);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Gets a single order by its ID after ownership has been verified by middleware.
 */
exports.getOrderById = async (req, res) => {
  // The checkOrderOwnership middleware attaches the order details to req.order.
  res.json(req.order);
};

/**
 * Allows a user to cancel their own order if it's in a cancellable state.
 */
exports.cancelOrder = async (req, res) => {
  const { order } = req; // Attached by checkOrderOwnership middleware
  const { orderId } = req.params;
  const user_id = req.user.user_id;

  try {
    const cancellableStatuses = ["pending_payment", "processing"];
    const fulfillment = await Fulfillment.findByOrderId(orderId);

    if (
      !cancellableStatuses.includes(order.order_status) ||
      (fulfillment && fulfillment.fulfillment_status !== "unfulfilled")
    ) {
      return res.status(403).json({
        error: "This order cannot be cancelled at its current stage.",
      });
    }

    const updatedOrder = await Order.updateStatus(
      orderId,
      user_id,
      "cancelled"
    );
    res.json({ message: "Order cancelled successfully", order: updatedOrder });
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Updates the status of an order (typically for admin use).
 */
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user_id = req.user.user_id;

  if (!status) {
    return res.status(400).json({ error: "Status field is required." });
  }

  const allowed_statuses = [
    "pending_payment",
    "processing",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
  ];
  if (!allowed_statuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  try {
    const updatedOrder = await Order.updateStatus(id, user_id, status);
    if (!updatedOrder) {
      return res.status(404).json({
        error: "Order not found or you do not have permission to update it.",
      });
    }
    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Deletes an order (typically for admin use).
 */
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.user_id;

  try {
    const result = await Order.delete(id, user_id);
    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }
    res.status(200).json({ message: result.message });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};
exports.adminGetOrders = async (req, res) => {
  const { status } = req.query;
  try {
    const orders = await Order.findAllDetailedOrders(status);
    res.json(orders);
  } catch (error) {
    console.error("Admin: Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
exports.cancelOrder = async (req, res) => {
  // req.order is attached by the checkOrderOwnership middleware
  const orderToCancel = req.order;

  // Business Logic: Check if the order is in a cancellable state.
  // You might want to adjust these statuses.
  const cancellableStatuses = ["pending_payment", "processing"];
  if (!cancellableStatuses.includes(orderToCancel.order_status)) {
    return res.status(409).json({
      // 409 Conflict is a good status code here
      error: `Order cannot be cancelled because its status is '${orderToCancel.order_status}'.`,
    });
  }

  try {
    // --- THE NEW LOGIC ---
    // 1. Get the list of product IDs from the order items
    // The req.order object from the middleware should already contain the items.
    if (orderToCancel.items && orderToCancel.items.length > 0) {
      const productIdsToRevert = orderToCancel.items.map(
        (item) => item.product_id
      );

      console.log(
        `Cancelling Order #${orderToCancel.order_id}. Reverting historic status for products:`,
        productIdsToRevert
      );

      // 2. Call the new model function to set historic = false
      await Product.markAsCurrent(productIdsToRevert);
    }
    // --- END OF NEW LOGIC ---

    // 3. Update the order status to 'cancelled'
    const cancelledOrder = await Order.updateStatus(
      orderToCancel.order_id,
      req.user.user_id,
      "cancelled"
    );

    // (Optional) Here you could also trigger a refund via Stripe if payment was made,
    // but that's a more complex flow. For now, we'll just update our DB.

    res.json({
      message: "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error(`Error cancelling order #${orderToCancel.order_id}:`, error);
    res
      .status(500)
      .json({
        error: "An internal error occurred while trying to cancel the order.",
      });
  }
};
