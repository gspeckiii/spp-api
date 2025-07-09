// controllers/fulfillmentController.js

const Fulfillment = require("../models/fulfillment");
const Order = require("../models/order");

/**
 * Creates a new fulfillment record for an order.
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
      return res
        .status(409)
        .json({ error: "Fulfillment record already exists for this order." });
    }
    console.error("Error creating fulfillment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Gets the fulfillment details for a specific order.
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
 * Updates a fulfillment (e.g., adds a tracking number).
 */
exports.updateFulfillment = async (req, res) => {
  const { orderId } = req.params;
  const { fulfillment_status } = req.body;

  if (Object.keys(req.body).length === 0) {
    return res
      .status(400)
      .json({ error: "At least one field to update is required." });
  }

  try {
    const updatedFulfillment = await Fulfillment.update(orderId, req.body);
    if (!updatedFulfillment) {
      return res
        .status(404)
        .json({ error: "Fulfillment record not found for this order." });
    }

    if (fulfillment_status) {
      await Order.updateStatus(orderId, req.user.user_id, fulfillment_status);
    }

    res.json(updatedFulfillment);
  } catch (error) {
    console.error("Error updating fulfillment:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
