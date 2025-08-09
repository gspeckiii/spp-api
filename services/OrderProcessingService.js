// === FINAL, DEFINITIVE, AND CORRECT FILE ===
const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const pool = require("../config/database");
const fetch = require("node-fetch"); // Assuming we are sticking with node-fetch

class OrderProcessingService {
  static async processNewOrder(payload, user) {
    const { items, total_amount, fulfillmentDetails } = payload;
    const { user_id, username, email } = user;

    if (!items || !items.length === 0 || !total_amount || !fulfillmentDetails) {
      throw new Error(
        "Invalid order payload: Missing items, total_amount, or fulfillmentDetails."
      );
    }

    // Step 1: Create the order and fulfillment records in your database. This part is working.
    const newOrder = await Order.create(user_id, items, total_amount);
    const savedFulfillment = await Fulfillment.create({
      order_id: newOrder.order_id,
      ...fulfillmentDetails,
    });

    // Step 2: Identify Printful items. This part is also working.
    const productIds = items.map((item) => item.product_id);
    const productsQuery = await pool.query(
      `SELECT id, is_printful_product, printful_variant_id FROM products WHERE id = ANY($1::int[])`,
      [productIds]
    );
    const productMap = new Map(productsQuery.rows.map((p) => [p.id, p]));
    const printfulItems = items
      .filter((item) => productMap.get(item.product_id)?.is_printful_product)
      .map((item) => ({
        variant_id: productMap.get(item.product_id).printful_variant_id,
        quantity: item.quantity,
      }));

    // Step 3: If there are Printful items, build the payload using the data WE JUST SAVED.
    if (printfulItems.length > 0) {
      // === THIS IS THE FIX ===
      // Instead of using the raw 'fulfillmentDetails' object from the frontend,
      // we use the 'savedFulfillment' object that was returned by our Fulfillment.create method.
      // This guarantees that the property names match what's in our database.
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

      // The rest of the logic uses this corrected payload.
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
        // Now we will get the clear error from Printful if something is still missing
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
