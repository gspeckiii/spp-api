// controllers/orderItemController.js

const OrderItem = require("../models/orderItem");
const Order = require("../models/order"); // We need the Order model to verify ownership

/**
 * Middleware to check if the logged-in user owns the parent order.
 * This is a crucial security step for nested routes.
 */
async function checkOrderOwnership(req, res, next) {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  try {
    const order = await Order.findById(orderId, userId);
    if (!order) {
      // Use findById since it already checks for user ownership
      return res.status(404).json({
        error:
          "Order not found or you do not have permission to access its items.",
      });
    }
    // If the order exists and is owned by the user, proceed.
    req.order = order; // Optionally attach the order to the request for later use
    next();
  } catch (error) {
    console.error("Error checking order ownership:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

// Get all items for a specific order
exports.getAllOrderItems = async (req, res) => {
  // Ownership is already checked by the middleware
  const { orderId } = req.params;
  try {
    const items = await OrderItem.findAllByOrderId(orderId);
    res.json(items);
  } catch (error) {
    console.error(`Error fetching items for order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Add a single item to an order
exports.addOrderItem = async (req, res) => {
  // Ownership is checked by middleware
  const { orderId } = req.params;
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    return res
      .status(400)
      .json({ error: "product_id and quantity are required." });
  }

  try {
    // In a real app, adding/removing items should trigger a recalculation of the order's total_amount.
    const newItem = await OrderItem.create({
      order_id: orderId,
      product_id,
      quantity,
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error(`Error adding item to order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Update a specific order item (e.g., change quantity)
exports.updateOrderItem = async (req, res) => {
  // Ownership is checked by middleware
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity) {
    return res.status(400).json({ error: "quantity is required." });
  }

  try {
    const updatedItem = await OrderItem.update(itemId, { quantity });
    if (!updatedItem) {
      return res.status(404).json({ error: "Order item not found." });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error(`Error updating order item ${itemId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Delete a specific order item
exports.deleteOrderItem = async (req, res) => {
  // Ownership is checked by middleware
  const { itemId } = req.params;
  try {
    const deletedItem = await OrderItem.delete(itemId);
    if (!deletedItem) {
      return res.status(404).json({ error: "Order item not found." });
    }
    res
      .status(200)
      .json({ message: "Order item deleted successfully.", item: deletedItem });
  } catch (error) {
    console.error(`Error deleting order item ${itemId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Export the middleware so the router can use it
exports.checkOrderOwnership = checkOrderOwnership;
