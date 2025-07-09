// controllers/orderController.js

const Order = require("../models/order"); // The data access model

exports.createOrder = async (req, res) => {
  const { items, total_amount } = req.body;
  const user_id = req.user.user_id; // From auth middleware

  if (!items || !Array.isArray(items) || items.length === 0 || !total_amount) {
    return res
      .status(400)
      .json({
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

exports.getUserOrders = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const orders = await Order.findAllByUserId(user_id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.user_id;

  try {
    const order = await Order.findById(id, user_id);
    if (!order) {
      return res
        .status(404)
        .json({
          error: "Order not found or you do not have permission to view it.",
        });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
};

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
      return res
        .status(404)
        .json({
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
