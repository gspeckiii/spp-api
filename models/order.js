// models/order.js

const db = require("../config/database");

class Order {
  // --- CREATE ---
  static async create(userId, items, totalAmount) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const orderQuery = `
                INSERT INTO orders (user_id, total_amount, order_status)
                VALUES ($1, $2, 'pending_payment')
                RETURNING order_id, order_status, created_at;
            `;
      const orderResult = await client.query(orderQuery, [userId, totalAmount]);
      const newOrder = orderResult.rows[0];

      const orderItemsQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES ($1, $2, $3, (SELECT prod_cost FROM products WHERE id = $2));
            `;
      for (const item of items) {
        await client.query(orderItemsQuery, [
          newOrder.order_id,
          item.product_id,
          item.quantity,
        ]);
      }

      await client.query("COMMIT");
      return newOrder;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database error in Order.create:", error);
      throw new Error("Failed to create order in database.");
    } finally {
      client.release();
    }
  }
  // In models/order.js, add these two methods

  /** --- NEW ADMIN METHOD --- */
  static async findAllDetailedOrders(statusFilter) {
    let statusConditions;
    if (statusFilter === "open") {
      statusConditions =
        "o.order_status IN ('pending_payment', 'processing','unfulfilled')";
    } else if (statusFilter === "closed") {
      statusConditions =
        "o.order_status IN ('shipped', 'delivered', 'completed', 'cancelled')";
    } else {
      statusConditions = "1=1";
    }

    const query = `
    SELECT
      o.order_id, o.user_id, o.order_status, o.total_amount, o.created_at, o.updated_at,
      (SELECT u.username FROM users u WHERE u.user_id = o.user_id) as username,
      (SELECT json_agg(item_details) FROM (
          SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price_at_purchase, p.prod_name,
          (SELECT ip.img_path FROM image_product ip WHERE ip.product_id = p.id ORDER BY ip.img_order LIMIT 1) as product_image_path
          FROM order_items oi JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.order_id
      ) AS item_details) AS items,
      (SELECT json_agg(payment_details) FROM (
          SELECT p.payment_id, p.payment_method, p.payment_status, p.amount_paid, p.created_at as payment_date
          FROM payments p WHERE p.order_id = o.order_id
      ) AS payment_details) AS payments,
      (SELECT row_to_json(fulfillment_details) FROM (
          SELECT * FROM fulfillments f WHERE f.order_id = o.order_id
      ) AS fulfillment_details) AS fulfillment
    FROM orders o
    WHERE ${statusConditions}
    ORDER BY o.created_at DESC;
  `;
    const { rows } = await db.query(query);
    return rows.map((order) => ({
      ...order,
      items: order.items || [],
      payments: order.payments || [],
      fulfillment: order.fulfillment || null,
    }));
  }

  /** --- NEW ADMIN METHOD --- */
  static async adminUpdateStatus(orderId, newStatus) {
    const query = `UPDATE orders SET order_status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *;`;
    const { rows } = await db.query(query, [newStatus, orderId]);
    return rows[0];
  }
  // --- READ ---

  /**
   * --- CORRECTED METHOD ---
   * Finds all orders for a user, aggregating all related data (items, images, payments, fulfillment)
   * into a single JSON object per order. This is highly efficient.
   * @param {number} userId - The ID of the user.
   * @param {string} statusFilter - 'open' or 'closed' to filter orders.
   */
  static async findDetailedOrdersByUserId(userId, statusFilter) {
    let statusConditions;
    if (statusFilter === "open") {
      // Open orders are those not yet completed or cancelled
      statusConditions =
        "o.order_status IN ('pending_payment', 'processing','unfulfilled')";
    } else if (statusFilter === "closed") {
      // Closed orders are those that are finished or cancelled
      statusConditions =
        "o.order_status IN ('shipped', 'delivered', 'completed', 'cancelled')";
    } else {
      // Default to all if no filter or invalid filter is provided
      statusConditions = "1=1";
    }

    const query = `
      SELECT
        o.order_id,
        o.order_status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        (
          SELECT json_agg(item_details)
          FROM (
            SELECT
              oi.order_item_id,
              oi.product_id,
              oi.quantity,
              oi.price_at_purchase,
              p.prod_name,
              (SELECT ip.img_path FROM image_product ip WHERE ip.product_id = p.id ORDER BY ip.img_order LIMIT 1) as product_image_path
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.order_id
          ) AS item_details
        ) AS items,
        (
          SELECT json_agg(payment_details)
          FROM (
            SELECT
              p.payment_id,
              p.payment_method,
              p.payment_status,
              p.amount_paid,
              p.created_at as payment_date
            FROM payments p
            WHERE p.order_id = o.order_id
          ) AS payment_details
        ) AS payments,
        (
          SELECT row_to_json(fulfillment_details)
          FROM (
            SELECT * FROM fulfillments f WHERE f.order_id = o.order_id
          ) AS fulfillment_details
        ) AS fulfillment
      FROM orders o
      WHERE o.user_id = $1 AND ${statusConditions}
      ORDER BY o.created_at DESC;
    `;

    try {
      const { rows } = await db.query(query, [userId]);
      // Clean up nulls from JSON aggregation for easier frontend consumption
      return rows.map((order) => ({
        ...order,
        items: order.items || [],
        payments: order.payments || [],
        fulfillment: order.fulfillment || null,
      }));
    } catch (error) {
      console.error(
        "Database error in Order.findDetailedOrdersByUserId:",
        error
      );
      throw new Error("Failed to fetch detailed orders from database.");
    }
  }

  static async findAllByUserId(userId) {
    const query =
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;";
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  // ...

  // We will make the userId parameter optional for system-level calls like the webhook.
  static async findById(orderId, userId = null) {
    let orderQuery = `
    SELECT o.*, u.email, u.username 
    FROM orders o 
    JOIN users u ON o.user_id = u.user_id /* <-- THE FIX IS HERE: u.id changed to u.user_id */
    WHERE o.order_id = $1
  `;
    const queryParams = [orderId];

    // If a userId is provided, add it to the query for ownership validation.
    if (userId) {
      orderQuery += " AND o.user_id = $2";
      queryParams.push(userId);
    }

    const orderResult = await db.query(orderQuery, queryParams);

    // The rest of the function is the same...
    if (orderResult.rows.length === 0) {
      return null;
    }

    // Also fetch fulfillment details for the email
    const fulfillmentQuery = "SELECT * FROM fulfillments WHERE order_id = $1;";
    const fulfillmentResult = await db.query(fulfillmentQuery, [orderId]);

    const itemsQuery = `
            SELECT oi.quantity, oi.price_at_purchase, p.prod_name, p.id AS product_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1;
        `;
    const itemsResult = await db.query(itemsQuery, [orderId]);

    const orderDetails = {
      ...orderResult.rows[0],
      items: itemsResult.rows,
      fulfillment: fulfillmentResult.rows[0] || null, // Add fulfillment to the object
    };
    return orderDetails;
  }

  // ...
  // --- UPDATE ---
  static async updateStatus(orderId, userId, newStatus) {
    const query = `
            UPDATE orders 
            SET order_status = $1, updated_at = NOW() 
            WHERE order_id = $2 AND user_id = $3
            RETURNING *;
        `;
    const { rows } = await db.query(query, [newStatus, orderId, userId]);
    return rows[0];
  }

  // --- DELETE ---
  static async delete(orderId, userId) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const ownerCheck = await client.query(
        "SELECT user_id FROM orders WHERE order_id = $1",
        [orderId]
      );
      if (
        ownerCheck.rows.length === 0 ||
        ownerCheck.rows[0].user_id !== userId
      ) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message: "Order not found or permission denied.",
        };
      }
      // You might want to cascade deletes or handle related items (payments, fulfillments)
      await client.query("DELETE FROM order_items WHERE order_id = $1", [
        orderId,
      ]);
      await client.query("DELETE FROM payments WHERE order_id = $1", [orderId]);
      await client.query("DELETE FROM fulfillments WHERE order_id = $1", [
        orderId,
      ]);
      await client.query("DELETE FROM orders WHERE order_id = $1", [orderId]);
      await client.query("COMMIT");
      return { success: true, message: "Order deleted successfully." };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database error in Order.delete:", error);
      throw new Error("Failed to delete order in database.");
    } finally {
      client.release();
    }
  }
  // ... (inside the 'class Order' block)

  /**
   * Finds a detailed order by the Printful Order ID.
   * This is used by the webhook to get customer details for the shipping email.
   * @param {number} printfulOrderId - The ID provided by Printful.
   * @returns {Promise<Object|null>} A promise that resolves to the detailed order object or null.
   */
  static async findByPrintfulOrderId(printfulOrderId) {
    // This query is very similar to your existing findById, but it joins on
    // the printful_order_id instead of the primary order_id.
    const query = `
      SELECT
        o.order_id, o.total_amount, o.created_at,
        u.username, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.printful_order_id = $1
      LIMIT 1;
    `;
    try {
      const { rows } = await db.query(query, [printfulOrderId]);
      return rows[0] || null;
    } catch (error) {
      console.error("Database error in Order.findByPrintfulOrderId:", error);
      throw new Error("Failed to fetch order by Printful ID from database.");
    }
  }
}

module.exports = Order;
