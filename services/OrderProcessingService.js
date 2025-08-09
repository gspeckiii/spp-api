// === FINAL, DEFINITIVE, AND CORRECT FILE ===
const fetch = require("node-fetch");
const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const pool = require("../config/database");

class OrderProcessingService {
  static async processNewOrder(payload, user) {
    const { items, total_amount, fulfillmentDetails } = payload;
    const { user_id, username, email } = user;

    // Get the Store ID from the environment variables, just like the API Key.
    const storeId = process.env.PRINTFUL_STORE_ID;
    if (!storeId) {
      throw new Error(
        "CRITICAL: PRINTFUL_STORE_ID is not defined in the .env file."
      );
    }

    // ... (Your existing logic to create the order/fulfillment in your DB is correct)
    const newOrder = await Order.create(user_id, items, total_amount);
    const savedFulfillment = await Fulfillment.create({
      order_id: newOrder.order_id,
      ...fulfillmentDetails,
    });

    // ... (Your existing logic to get the correct printful_variant_id is correct)
    const internalProductIds = items.map((item) => item.product_id);
    const productsQuery = await pool.query(
      `SELECT id, printful_variant_id FROM products WHERE id = ANY($1::int[]) AND is_printful_product = TRUE`,
      [internalProductIds]
    );
    const productMap = new Map(
      productsQuery.rows.map((p) => [p.id, p.printful_variant_id])
    );
    const printfulItems = items
      .filter((item) => productMap.has(item.product_id))
      .map((item) => ({
        variant_id: productMap.get(item.product_id),
        quantity: item.quantity,
      }));

    if (printfulItems.length > 0) {
      // === THIS IS THE CRITICAL FIX ===
      // We are adding the 'store_id' property to the main level of the payload.
      const printfulOrderPayload = {
        store_id: storeId, // <-- THE MISSING PIECE
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
      // ===============================

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

      await pool.query(
        "UPDATE orders SET printful_order_id = $1 WHERE order_id = $2",
        [apiResponse.result.id, newOrder.order_id]
      );
    }

    return newOrder;
  }
}

module.exports = OrderProcessingService;
