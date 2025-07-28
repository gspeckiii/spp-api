//
// models/fulfillment.js

const db = require("../config/database");

class Fulfillment {
  /**
   * Creates a new fulfillment record for an order.
   */
  static async create(fulfillmentData) {
    const {
      order_id,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
    } = fulfillmentData;
    const query = `
            INSERT INTO fulfillments (
                order_id, shipping_address_line1, shipping_address_line2, 
                shipping_city, shipping_state, shipping_postal_code, shipping_country
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
    const values = [
      order_id,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /**
   * Finds the fulfillment record for a specific order.
   */
  static async findByOrderId(orderId) {
    const query = "SELECT * FROM fulfillments WHERE order_id = $1;";
    const { rows } = await db.query(query, [orderId]);
    return rows[0] || null;
  }

  /**
   * Updates an existing fulfillment record (e.g., adds tracking info).
   */
  static async update(orderId, updateData) {
    const { fulfillment_status, shipping_provider, tracking_number } =
      updateData;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (fulfillment_status) {
      fields.push(`fulfillment_status = $${paramIndex++}`);
      values.push(fulfillment_status);
    }
    if (shipping_provider) {
      fields.push(`shipping_provider = $${paramIndex++}`);
      values.push(shipping_provider);
    }
    if (tracking_number) {
      fields.push(`tracking_number = $${paramIndex++}`);
      values.push(tracking_number);
    }
    if (fulfillment_status === "shipped") {
      fields.push(`shipped_at = NOW()`);
    } else if (fulfillment_status === "delivered") {
      fields.push(`delivered_at = NOW()`);
    }

    if (fields.length === 0) return this.findByOrderId(orderId);

    values.push(orderId);
    const query = `
            UPDATE fulfillments
            SET ${fields.join(", ")}
            WHERE order_id = $${paramIndex}
            RETURNING *;
        `;
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }
  static async create(fulfillmentData) {
    const {
      order_id,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
    } = fulfillmentData;
    const query = `
            INSERT INTO fulfillments (
                order_id, shipping_address_line1, shipping_address_line2, 
                shipping_city, shipping_state, shipping_postal_code, shipping_country
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
    const values = [
      order_id,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async findByOrderId(orderId) {
    const query = "SELECT * FROM fulfillments WHERE order_id = $1;";
    const { rows } = await db.query(query, [orderId]);
    return rows[0] || null;
  }

  /**
   * --- MODIFIED: Now supports updating the address ---
   * Updates an existing fulfillment record (e.g., adds tracking info or changes address).
   */
  static async update(orderId, updateData) {
    const {
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      fulfillment_status,
      shipping_provider,
      tracking_number,
    } = updateData;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Add address fields
    if (shipping_address_line1) {
      fields.push(`shipping_address_line1 = $${paramIndex++}`);
      values.push(shipping_address_line1);
    }
    // Allow address line 2 to be updated to an empty string
    if (shipping_address_line2 !== undefined) {
      fields.push(`shipping_address_line2 = $${paramIndex++}`);
      values.push(shipping_address_line2);
    }
    if (shipping_city) {
      fields.push(`shipping_city = $${paramIndex++}`);
      values.push(shipping_city);
    }
    if (shipping_state) {
      fields.push(`shipping_state = $${paramIndex++}`);
      values.push(shipping_state);
    }
    if (shipping_postal_code) {
      fields.push(`shipping_postal_code = $${paramIndex++}`);
      values.push(shipping_postal_code);
    }
    if (shipping_country) {
      fields.push(`shipping_country = $${paramIndex++}`);
      values.push(shipping_country);
    }
    // Original fields
    if (fulfillment_status) {
      fields.push(`fulfillment_status = $${paramIndex++}`);
      values.push(fulfillment_status);
    }
    if (shipping_provider) {
      fields.push(`shipping_provider = $${paramIndex++}`);
      values.push(shipping_provider);
    }
    if (tracking_number) {
      fields.push(`tracking_number = $${paramIndex++}`);
      values.push(tracking_number);
    }
    if (fulfillment_status === "shipped") {
      fields.push(`shipped_at = NOW()`);
    } else if (fulfillment_status === "delivered") {
      fields.push(`delivered_at = NOW()`);
    }

    if (fields.length === 0) return this.findByOrderId(orderId);

    values.push(orderId);
    const query = `
            UPDATE fulfillments
            SET ${fields.join(", ")}
            WHERE order_id = $${paramIndex}
            RETURNING *;
        `;
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }
}

module.exports = Fulfillment;
