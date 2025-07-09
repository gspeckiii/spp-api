// models/payment.js

const db = require("../config/database");

class Payment {
  /**
   * Creates a new payment record in the database. This logs a payment attempt.
   * @param {Object} paymentData - The data for the payment.
   * @param {number} paymentData.order_id - The ID of the associated order.
   * @param {string} paymentData.payment_method - e.g., 'stripe', 'paypal'.
   * @param {string} paymentData.payment_status - e.g., 'pending', 'succeeded', 'failed'.
   * @param {number} paymentData.amount_paid - The amount that was charged.
   * @param {string} paymentData.currency - The currency of the transaction.
   * @param {string} [paymentData.transaction_id] - The unique ID from the payment gateway.
   * @returns {Promise<Object>} A promise that resolves to the newly created payment object.
   */
  static async create({
    order_id,
    payment_method,
    payment_status,
    amount_paid,
    currency,
    transaction_id = null,
  }) {
    const query = `
            INSERT INTO payments (order_id, payment_method, payment_status, amount_paid, currency, transaction_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
    const values = [
      order_id,
      payment_method,
      payment_status,
      amount_paid,
      currency,
      transaction_id,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  /**
   * Finds all payments associated with a specific order ID.
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<Array>} A promise that resolves to an array of payment objects.
   */
  static async findAllByOrderId(orderId) {
    const query =
      "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC;";
    const { rows } = await db.query(query, [orderId]);
    return rows;
  }

  /**
   * Finds the most recent successful payment for a given order.
   * Useful for checking if an order is already paid.
   * @param {number} orderId - The ID of the order.
   * @returns {Promise<Object|null>} A promise that resolves to the successful payment object or null.
   */
  static async findSuccessfulPaymentByOrderId(orderId) {
    const query = `
            SELECT * FROM payments 
            WHERE order_id = $1 AND payment_status = 'succeeded' 
            ORDER BY created_at DESC 
            LIMIT 1;
        `;
    const { rows } = await db.query(query, [orderId]);
    return rows[0] || null;
  }
}

module.exports = Payment;
