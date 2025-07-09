// controllers/paymentController.js

const Payment = require("../models/payment");
const Order = require("../models/order");

/**
 * Creates a new payment for a given order.
 * This is the primary endpoint for processing a payment.
 */
exports.createPayment = async (req, res) => {
  // The checkOrderOwnership middleware has already confirmed the user owns this order
  const { orderId } = req.params;
  const { payment_method_token } = req.body; // e.g., a token from Stripe.js or PayPal SDK

  if (!payment_method_token) {
    return res
      .status(400)
      .json({ error: "A payment method token is required." });
  }

  try {
    // Step 1: Fetch the order from our DB to get the true total_amount
    const order = req.order; // The order was attached to req by the ownership middleware

    // Step 2: Check if the order is already paid
    const existingPayment = await Payment.findSuccessfulPaymentByOrderId(
      orderId
    );
    if (existingPayment) {
      return res
        .status(409)
        .json({ error: "This order has already been paid successfully." });
    }

    // --- PSEUDOCODE for Payment Gateway Interaction ---
    // This is where you would integrate with Stripe, PayPal, etc.
    // For now, we will simulate a successful payment.

    // 1. Call Payment Gateway (e.g., Stripe, PayPal)
    // const charge = await stripe.charges.create({
    //     amount: order.total_amount * 100, // Stripe expects cents
    //     currency: 'usd',
    //     source: payment_method_token,
    //     description: `Payment for Order #${orderId}`
    // });

    // 2. Simulate a successful response from the gateway
    const gatewayResponse = {
      id: `txn_${new Date().getTime()}`, // A simulated transaction ID
      status: "succeeded",
      amount: order.total_amount,
    };
    // --- END PSEUDOCODE ---

    // Step 3: Based on the gateway response, log the payment in our DB
    if (gatewayResponse.status === "succeeded") {
      const paymentData = {
        order_id: orderId,
        payment_method: "simulated_card", // In real life, 'stripe', 'paypal' etc.
        payment_status: "succeeded",
        amount_paid: gatewayResponse.amount,
        currency: "USD",
        transaction_id: gatewayResponse.id,
      };
      const newPayment = await Payment.create(paymentData);

      // Step 4: IMPORTANT - Update the main order's status
      await Order.updateStatus(orderId, req.user.user_id, "processing");

      res
        .status(201)
        .json({ message: "Payment successful!", payment: newPayment });
    } else {
      // If the gateway payment failed
      // Log the failed attempt
      await Payment.create({
        order_id: orderId,
        payment_method: "simulated_card",
        payment_status: "failed",
        amount_paid: order.total_amount,
        currency: "USD",
      });
      res.status(402).json({ error: "Payment failed at the gateway." });
    }
  } catch (error) {
    console.error("Error processing payment for order:", orderId, error);
    res
      .status(500)
      .json({ error: "Internal server error during payment processing." });
  }
};

/**
 * Gets all payment records for a specific order.
 */
exports.getOrderPayments = async (req, res) => {
  // Ownership is already checked
  const { orderId } = req.params;
  try {
    const payments = await Payment.findAllByOrderId(orderId);
    res.json(payments);
  } catch (error) {
    console.error(`Error fetching payments for order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};
