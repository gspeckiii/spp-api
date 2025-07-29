const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/payment");
const Order = require("../models/order");
const Product = require("../models/product");
const { sendMail } = require("../middleware/emailService"); // 1. Import the email service
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
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Only handle the event we care about
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // --- Step 1: Safely get the Order ID from Stripe's metadata ---
    const orderIdFromStripe = paymentIntent.metadata.order_id;
    const userIdFromStripe = paymentIntent.metadata.user_id;

    console.log(`✅ Webhook received for PaymentIntent: ${paymentIntent.id}`);
    console.log(`   > Metadata contains Order ID: ${orderIdFromStripe}`);

    // Safety check: If there's no order ID, we can't proceed.
    if (!orderIdFromStripe) {
      console.error(
        "Webhook Error: CRITICAL - Missing order_id in paymentIntent metadata."
      );
      return res
        .status(200)
        .send("Webhook processed, but metadata was missing order_id.");
    }

    try {
      // --- Step 2: Check if this order has already been processed ---
      const existingPayment = await Payment.findSuccessfulPaymentByOrderId(
        orderIdFromStripe
      );
      if (existingPayment) {
        console.log(
          `Webhook Info: Order ${orderIdFromStripe} has already been processed. Acknowledging event.`
        );
        return res.send();
      }

      // --- Step 3: Create the payment record in our database ---
      // This is where the original error was happening.
      const paymentDataForDB = {
        order_id: orderIdFromStripe, // Use the variable we got from metadata
        payment_method: "stripe",
        payment_status: "succeeded",
        amount_paid: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        transaction_id: paymentIntent.id,
      };

      console.log(
        `   > Attempting to create payment record:`,
        paymentDataForDB
      );
      await Payment.create(paymentDataForDB);
      console.log(
        `   > ✅ Payment record created for Order ID: ${orderIdFromStripe}`
      );

      // --- Step 4: Update the order status ---
      await Order.updateStatus(
        orderIdFromStripe,
        userIdFromStripe,
        "processing"
      );
      console.log(
        `   > ✅ Order status updated to 'processing' for Order ID: ${orderIdFromStripe}`
      );

      // --- Step 5: Fetch details to update products and send email ---
      const fullOrderDetails = await Order.findById(orderIdFromStripe);

      if (
        fullOrderDetails &&
        fullOrderDetails.items &&
        fullOrderDetails.items.length > 0
      ) {
        // --- Step 6: Mark products as historic ---
        const productIdsToUpdate = fullOrderDetails.items.map(
          (item) => item.product_id
        );
        console.log(
          `   > Attempting to mark product(s) as historic: [${productIdsToUpdate.join(
            ", "
          )}]`
        );
        await Product.markAsHistoric(productIdsToUpdate);

        // --- Step 7: Send the confirmation email ---
        console.log(
          `   > Preparing to send confirmation email to ${fullOrderDetails.email}`
        );
        const { email, username, items, total_amount, fulfillment } =
          fullOrderDetails;
        const subject = `Order Confirmation - Sherman Peck Productions (#${orderIdFromStripe})`;
        const html = `...`; // Your email HTML

        sendMail({ to: email, subject, html }).catch((err) => {
          console.error(
            `Webhook Email Error for order ${orderIdFromStripe}`,
            err
          );
        });
      } else {
        console.log(
          "Webhook Warning: Could not find full order details or items for email/product update."
        );
      }
    } catch (dbError) {
      // This is the error log you are currently seeing
      console.error(
        `❌ Webhook DB Error for Order ${orderIdFromStripe}`,
        dbError
      );
      // Return 500 so Stripe knows to retry the webhook later.
      return res
        .status(500)
        .json({ error: "Database update failed during webhook processing." });
    }
  }

  // Acknowledge receipt of the event to Stripe
  res.send();
};
// ... (other functions like handleWebhook, createPaymentIntent)

/**
 * Gets all payment records for a specific order.
 */
exports.getOrderPayments = async (req, res) => {
  // Ownership is already checked by the middleware
  const { orderId } = req.params;
  try {
    const payments = await Payment.findAllByOrderId(orderId);
    res.json(payments);
  } catch (error) {
    console.error(`Error fetching payments for order ${orderId}:`, error);
    res.status(500).json({ error: "Internal server error." });
  }
};
