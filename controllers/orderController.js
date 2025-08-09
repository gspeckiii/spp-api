// === UPDATED FILE ===

// The controller now requires the Service, not all the individual pieces.
const OrderProcessingService = require("../services/OrderProcessingService");

// Models are still needed for the other, simpler controller functions.
const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const Product = require("../models/product");

// --- THIS IS THE REFACTORED CONTROLLER FUNCTION ---
// Refactored to use the service layer
exports.createOrder = async (req, res) => {
  try {
    const newOrder = await OrderProcessingService.processNewOrder(
      req.body,
      req.user
    );
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("Error in createOrder controller:", error.message);
    res
      .status(500)
      .json({
        error: "An internal server error occurred while creating the order.",
      });
  }
};

/**
 * Fetches detailed orders for the logged-in user based on a status query.
 */
exports.getUserOrders = async (req, res) => {
  const user_id = req.user.user_id;
  const { status } = req.query;

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
  res.json(req.order);
};

/**
 * Allows a user to cancel their own order. Also reverts the 'historic' status
 * for non-Printful products in the order.
 */
exports.cancelOrder = async (req, res) => {
  const orderToCancel = req.order; // Attached by checkOrderOwnership middleware

  // Business Logic: Check if the order is in a cancellable state.
  const cancellableStatuses = ["pending_payment", "processing"];
  if (!cancellableStatuses.includes(orderToCancel.order_status)) {
    return res.status(409).json({
      error: `Order cannot be cancelled because its status is '${orderToCancel.order_status}'.`,
    });
  }

  try {
    // Revert the historic status for any non-Printful products in the order
    if (orderToCancel.items && orderToCancel.items.length > 0) {
      const productIdsToRevert = orderToCancel.items.map(
        (item) => item.product_id
      );

      console.log(
        `Cancelling Order #${orderToCancel.order_id}. Reverting historic status for products:`,
        productIdsToRevert
      );

      // Call the model function to set historic = false for these products
      await Product.markAsCurrent(productIdsToRevert);
    }

    // Update the order status to 'cancelled'
    const cancelledOrder = await Order.updateStatus(
      orderToCancel.order_id,
      req.user.user_id,
      "cancelled"
    );

    // TODO: If the order was for Printful, you might need to call their API to cancel it here.
    // if (orderToCancel.printful_order_id) {
    //   await printful.orders.cancelOrder(orderToCancel.printful_order_id);
    // }

    res.json({
      message: "Order cancelled successfully.",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error(`Error cancelling order #${orderToCancel.order_id}:`, error);
    res.status(500).json({
      error: "An internal error occurred while trying to cancel the order.",
    });
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

/**
 * Fetches all orders in the system, for admin use.
 */
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
