// === FINAL, COMPLETE, AND CORRECTED FILE ===
const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const pool = require("../config/database");
const fetch = require("node-fetch");

class OrderProcessingService {
  /**
   * The main workflow for creating a new order, including Printful integration.
   * This version is robust and uses the local database as the source of truth for Printful IDs.
   * @param {object} payload - The order data from the request body.
   * @param {object} user - The authenticated user object.
   * @returns {Promise<object>} The newly created order object from our database.
   * @throws {Error} If any part of the process fails.
   */
  static async processNewOrder(payload, user) {
    const { items, total_amount, fulfillmentDetails } = payload;
    const { user_id, username, email } = user;

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !total_amount ||
      !fulfillmentDetails
    ) {
      throw new Error(
        "Invalid order payload: Missing items, total_amount, or fulfillmentDetails."
      );
    }

    // Step 1: Create the order and fulfillment records in your database. This is working correctly.
    const newOrder = await Order.create(user_id, items, total_amount);
    const savedFulfillment = await Fulfillment.create({
      order_id: newOrder.order_id,
      ...fulfillmentDetails,
    });

    // === THIS IS THE CRITICAL FIX ===
    // We will now build the 'printfulItems' array by looking up the correct
    // 'printful_variant_id' from our own database, ignoring what the frontend sent.

    // 1. Get the internal product IDs from the incoming order payload.
    const internalProductIds = items.map((item) => item.product_id);

    // 2. Query our own database for those products to get the REAL Printful Variant ID.
    const productsQuery = await pool.query(
      `SELECT id, printful_variant_id FROM products WHERE id = ANY($1::int[]) AND is_printful_product = TRUE`,
      [internalProductIds]
    );

    // 3. Create a map for easy lookup (internal ID -> Printful Variant ID).
    const productMap = new Map(
      productsQuery.rows.map((p) => [p.id, p.printful_variant_id])
    );

    // 4. Build the 'printfulItems' array using the correct IDs from our database.
    const printfulItems = items
      .filter((item) => productMap.has(item.product_id)) // Only include items that are valid Printful products
      .map((item) => ({
        variant_id: productMap.get(item.product_id), // Use the correct BIGINT id from our DB
        quantity: item.quantity,
      }));
    // ===============================

    // Step 3: If there are any valid Printful items, build the payload and send it to Printful.
    if (printfulItems.length > 0) {
      const printfulOrderPayload = {
        recipient: {
          name: username,
          email: email,
          address1: savedFulfillment.shipping_address_line1,
          address2: savedFulfillment.shipping_address_line2 || null,
          city: savedFulfillment.shipping_city,
          state_code: savedFulfillment.shipping_state,
          country_code:
            savedFulfillment.shipping_country === "USA"
              ? "US"
              : savedFulfillment.shipping_country,
          zip: savedFulfillment.shipping_postal_code,
        },
        items: printfulItems,
      };

      const url = `https://api.printful.com/orders`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printfulOrderPayload),
      };

      const response = await fetch(url, options);
      const apiResponse = await response.json();

      if (!response.ok) {
        console.error("Printful API Error:", apiResponse);
        throw new Error(
          `Printful API Error: ${response.status} - ${apiResponse.error?.message}`
        );
      }

      // Link our internal order to the Printful order ID.
      await pool.query(
        "UPDATE orders SET printful_order_id = $1 WHERE order_id = $2",
        [apiResponse.result.id, newOrder.order_id]
      );
    }

    // Return the internal order object to the controller.
    return newOrder;
  }
}

module.exports = OrderProcessingService;
