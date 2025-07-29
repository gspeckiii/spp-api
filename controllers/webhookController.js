// controllers/webhookController.js
const Fulfillment = require("../models/fulfillment");
const Order = require("../models/order");
const EasyPost = require("@easypost/api"); // Make sure EasyPost is required

exports.handleTrackingWebhook = async (req, res) => {
  const webhookSecret = process.env.EASYPOST_WEBHOOK_SECRET;

  try {
    // 1. VERIFY THE WEBHOOK SIGNATURE
    const event = EasyPost.Webhook.validate(
      req.rawBody,
      req.headers,
      webhookSecret
    );

    console.log(
      "Received and validated EasyPost webhook:",
      JSON.stringify(event, null, 2)
    );

    // 2. PROCESS THE EVENT
    if (event.description === "tracker.updated") {
      const tracker = event.result;
      const trackingCode = tracker.tracking_code;

      const fulfillment = await Fulfillment.findByTrackingCode(trackingCode);

      if (!fulfillment) {
        console.warn(
          `Webhook received for unknown tracking code: ${trackingCode}`
        );
        return res.sendStatus(200);
      }

      const orderId = fulfillment.order_id;
      const newStatus = tracker.status; // e.g., 'in_transit', 'delivered'

      let updatePayload = {};
      let newOrderStatus = null;

      // Logic to update based on status
      if (
        newStatus === "delivered" &&
        fulfillment.fulfillment_status !== "delivered"
      ) {
        console.log(`Order #${orderId} delivered!`);
        updatePayload.fulfillment_status = "delivered";
        updatePayload.delivered_at = new Date();
        newOrderStatus = "delivered";
      } else if (
        newStatus === "in_transit" &&
        (fulfillment.fulfillment_status === "unfulfilled" ||
          fulfillment.fulfillment_status === "processing")
      ) {
        console.log(`Order #${orderId} is now in transit.`);
        updatePayload.fulfillment_status = "shipped";
        // Only set shipped_at if it hasn't been set before
        if (!fulfillment.shipped_at) {
          updatePayload.shipped_at = new Date();
        }
        newOrderStatus = "shipped";
      }

      // If there's something to update in our database
      if (Object.keys(updatePayload).length > 0) {
        await Fulfillment.update(orderId, updatePayload);
        if (newOrderStatus) {
          await Order.adminUpdateStatus(orderId, newOrderStatus);
        }
        console.log(
          `Successfully updated Order #${orderId} status based on webhook.`
        );
      }
    }

    // Always respond with a 200 OK to acknowledge the webhook
    res.sendStatus(200);
  } catch (err) {
    // This catch block will handle signature validation errors
    if (err instanceof EasyPost.errors.SignatureVerificationError) {
      console.error("Webhook signature verification failed.", err.message);
      return res.sendStatus(401); // Unauthorized
    }
    // Handle other potential errors during processing
    console.error("Error processing webhook:", err);
    return res.sendStatus(500);
  }
};
