const fetch = require("node-fetch");
const Order = require("../models/order");
const Fulfillment = require("../models/fulfillment");
const pool = require("../config/database");

class OrderProcessingService {
  static async processNewOrder(payload, user) {
    const { items, total_amount, fulfillmentDetails } = payload;
    const { user_id, username, email } = user;

    const newOrder = await Order.create(user_id, items, total_amount);
    await Fulfillment.create({
      order_id: newOrder.order_id,
      ...fulfillmentDetails,
    });

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

    if (printfulItems.length > 0) {
      const url = `https://api.printful.com/orders`;
      const printfulOrderPayload = {
        /* build your payload here */
      };
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
