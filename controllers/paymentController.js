const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");
const Order = require("../models/order");

/**
 * Creates a Stripe Payment Intent for a given order.
 * This route is protected and expects middleware to have run.
 */
exports.createPaymentIntent = async (req, res) => {
  // req.order is attached by your checkOrderOwnership middleware
  // req.user is attached by your authenticateToken middleware
  const { order } = req;
  const { user } = req;

  try {
    // Check if the order is already paid using your model method
    const existingPayment = await Payment.findSuccessfulPaymentByOrderId(
      order.order_id
    );
    if (existingPayment) {
      return res
        .status(409)
        .json({ error: "This order has already been paid successfully." });
    }

    // Create a PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // in cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.order_id,
        user_id: user.user_id,
      },
    });

    // Send the client secret back to the frontend
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error(
      "Error creating Payment Intent for order:",
      order.order_id,
      error
    );
    res
      .status(500)
      .json({ error: "Internal server error while preparing payment." });
  }
};

/**
 * Handles incoming webhooks from Stripe.
 * This is a public route and does its own security check.
 */
exports.handleWebhook = async (req, res) => {
  // The rest of this function is IDENTICAL to the one in the previous answer.
  // It verifies the signature, and on 'payment_intent.succeeded', it uses
  // Payment.create() and Order.updateStatus() to update your database.
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log(
      `Webhook: PaymentIntent ${paymentIntent.id} for Order ${paymentIntent.metadata.order_id} was successful!`
    );
    const { order_id, user_id } = paymentIntent.metadata;

    try {
      await Payment.create({
        order_id: order_id,
        payment_method: "stripe",
        payment_status: "succeeded",
        amount_paid: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        transaction_id: paymentIntent.id,
      });
      await Order.updateStatus(order_id, user_id, "processing");
      console.log(`Webhook: Successfully updated DB for Order ${order_id}`);
    } catch (dbError) {
      console.error(
        `Webhook DB Error: Failed to update database for Order ${order_id}`,
        dbError
      );
      return res.status(500).json({ error: "Database update failed." });
    }
  } else {
    console.log(`Webhook: Unhandled event type ${event.type}`);
  }

  res.send();
};

/**
 * Gets all payment records for a specific order. (No changes needed)
 */
exports.getOrderPayments = async (req, res) => {
  const { orderId } = req.params;
  try {
    const payments = await Payment.findAllByOrderId(orderId);
    res.json(payments);
  } catch (error) {
    console.error(`Error fetching payments for order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};
