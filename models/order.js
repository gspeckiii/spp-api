// models/order.js

// === THE FIX: Use the correct path to your database configuration ===
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

  // --- READ ---
  static async findAllByUserId(userId) {
    const query =
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC;";
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  static async findById(orderId, userId) {
    const orderQuery =
      "SELECT * FROM orders WHERE order_id = $1 AND user_id = $2;";
    const orderResult = await db.query(orderQuery, [orderId, userId]);
    if (orderResult.rows.length === 0) {
      return null;
    }
    const itemsQuery = `
            SELECT oi.quantity, oi.price_at_purchase, p.prod_name, p.id AS product_id
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1;
        `;
    const itemsResult = await db.query(itemsQuery, [orderId]);
    const orderDetails = { ...orderResult.rows[0], items: itemsResult.rows };
    return orderDetails;
  }

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
      await client.query("DELETE FROM order_items WHERE order_id = $1", [
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
}

module.exports = Order;
