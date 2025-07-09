// models/orderItem.js

const db = require("../config/database");

class OrderItem {
  /**
   * Finds all items associated with a specific order ID.
   * Also joins with the products table to get the product name.
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<Array>} A promise that resolves to an array of order items.
   */
  static async findAllByOrderId(orderId) {
    const query = `
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.product_id,
                p.prod_name,
                oi.quantity,
                oi.price_at_purchase
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
            ORDER BY oi.order_item_id;
        `;
    const { rows } = await db.query(query, [orderId]);
    return rows;
  }

  /**
   * Finds a single order item by its ID.
   * @param {number} orderItemId - The ID of the order item.
   * @returns {Promise<Object|null>} A promise that resolves to the order item object or null if not found.
   */
  static async findById(orderItemId) {
    const query = `
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.product_id,
                p.prod_name,
                oi.quantity,
                oi.price_at_purchase
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_item_id = $1;
        `;
    const { rows } = await db.query(query, [orderItemId]);
    return rows[0] || null;
  }

  /**
   * Adds a new item to an existing order.
   * Note: This would typically require recalculating the order total, which is a complex operation.
   * For simplicity, this example only adds the item.
   * @param {Object} itemData - The data for the new item.
   * @param {number} itemData.order_id - The ID of the order to add to.
   * @param {number} itemData.product_id - The ID of the product.
   * @param {number} itemData.quantity - The quantity of the product.
   * @returns {Promise<Object>} A promise that resolves to the newly created order item.
   */
  static async create({ order_id, product_id, quantity }) {
    // In a real app, you would fetch the price from the DB here.
    const query = `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES ($1, $2, $3, (SELECT prod_cost FROM products WHERE id = $2))
            RETURNING *;
        `;
    const values = [order_id, product_id, quantity];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /**
   * Updates the quantity of an existing order item.
   * @param {number} orderItemId - The ID of the item to update.
   * @param {number} quantity - The new quantity.
   * @returns {Promise<Object|null>} A promise that resolves to the updated order item or null if not found.
   */
  static async update(orderItemId, { quantity }) {
    const query = `
            UPDATE order_items
            SET quantity = $1
            WHERE order_item_id = $2
            RETURNING *;
        `;
    const { rows } = await db.query(query, [quantity, orderItemId]);
    return rows[0] || null;
  }

  /**
   * Deletes an item from an order.
   * @param {number} orderItemId - The ID of the item to delete.
   * @returns {Promise<Object|null>} A promise that resolves to the deleted item or null if not found.
   */
  static async delete(orderItemId) {
    const query = `
            DELETE FROM order_items
            WHERE order_item_id = $1
            RETURNING *;
        `;
    const { rows } = await db.query(query, [orderItemId]);
    return rows[0] || null;
  }
}

module.exports = OrderItem;
