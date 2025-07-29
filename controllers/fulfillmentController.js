// controllers/fulfillmentController.js

const Fulfillment = require("../models/fulfillment");
const Order = require("../models/order");

/**
 * Creates a new fulfillment record for an order. (User-facing)
 */
exports.createFulfillment = async (req, res) => {
  const { orderId } = req.params;
  const {
    shipping_address_line1,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
  } = req.body;

  if (
    !shipping_address_line1 ||
    !shipping_city ||
    !shipping_state ||
    !shipping_postal_code ||
    !shipping_country
  ) {
    return res
      .status(400)
      .json({ error: "Missing required shipping address fields." });
  }

  try {
    const existingFulfillment = await Fulfillment.findByOrderId(orderId);
    if (existingFulfillment) {
      return res
        .status(409)
        .json({ error: "Fulfillment record already exists for this order." });
    }
    const newFulfillment = await Fulfillment.create({
      order_id: orderId,
      ...req.body,
    });
    res.status(201).json(newFulfillment);
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res
        .status(409)
        .json({ error: "Fulfillment record already exists for this order." });
    }
    console.error("Error creating fulfillment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Gets the fulfillment details for a specific order. (User-facing)
 */
exports.getFulfillment = async (req, res) => {
  const { orderId } = req.params;
  try {
    const fulfillment = await Fulfillment.findByOrderId(orderId);
    if (!fulfillment) {
      return res
        .status(404)
        .json({ error: "Fulfillment information not found for this order." });
    }
    res.json(fulfillment);
  } catch (error) {
    console.error("Error getting fulfillment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Updates a fulfillment record. (User-facing for address changes)
 */
exports.updateFulfillment = async (req, res) => {
  const { orderId } = req.params;

  if (Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field to update is required." });
  }

  try {
    // Before updating, ensure the order is in a state that allows user edits.
    const order = await Order.findById(orderId, req.user.user_id);
    if (!order || order.fulfillment?.fulfillment_status !== "unfulfilled") {
      return res
        .status(403)
        .json({ error: "This order's address can no longer be modified." });
    }

    const updatedFulfillment = await Fulfillment.update(orderId, req.body);
    if (!updatedFulfillment) {
      return res
        .status(404)
        .json({ error: "Fulfillment record not found for this order." });
    }
    res.json(updatedFulfillment);
  } catch (error) {
    console.error("Error updating fulfillment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * --- ADMIN CONTROLLER ---
 * Updates a fulfillment record. Admin-only access.
 * This also syncs the status to the parent order.
 */
exports.adminUpdateFulfillment = async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No update data provided." });
  }

  try {
    const updatedFulfillment = await Fulfillment.update(orderId, updateData);
    if (!updatedFulfillment) {
      return res.status(404).json({ error: "Fulfillment record not found." });
    }

    const newStatus = updateData.fulfillment_status;
    if (newStatus) {
      // If status is 'delivered', set order status to 'delivered'. Otherwise, sync the status.
      await Order.adminUpdateStatus(
        orderId,
        newStatus === "delivered" ? "delivered" : newStatus
      );
    }

    res.json(updatedFulfillment);
  } catch (error) {
    console.error(
      `Admin error updating fulfillment for order ${orderId}:`,
      error
    );
    res.status(500).json({ error: "Internal server error." });
  }
};
