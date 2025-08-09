// === FINAL AND COMPLETE FILE ===
const crypto = require("crypto");
const pool = require("../config/database");
const { sendMail } = require("../services/EmailService"); // 1. Import your email service
const Order = require("../models/order"); // 2. Import the Order model

exports.handleWebhook = async (req, res) => {
  // Verify the signature for security (this part is unchanged)
  const signature = req.headers["x-printful-signature"];
  const calculatedSignature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(req.body)
    .digest("base64");

  if (signature !== calculatedSignature) {
    console.warn("Invalid Printful webhook signature received.");
    return res.status(401).send("Invalid signature");
  }

  const { type, data } = JSON.parse(req.body);
  console.log(`Received Printful webhook: ${type}`);

  try {
    if (type === "package_shipped") {
      const { order, shipment } = data;
      const printfulOrderId = order.id;
      const trackingNumber = shipment.tracking_number;
      const trackingUrl = shipment.tracking_url;
      const carrier = shipment.carrier;

      // 3. Find our internal order details using the new model function
      const internalOrder = await Order.findByPrintfulOrderId(printfulOrderId);

      if (internalOrder) {
        const internalOrderId = internalOrder.order_id;

        // 4. Update our database (this part is the same as before)
        await pool.query(
          `UPDATE fulfillments SET fulfillment_status = 'shipped', tracking_number = $1, shipped_at = NOW() WHERE order_id = $2`,
          [trackingNumber, internalOrderId]
        );
        await pool.query(
          `UPDATE orders SET order_status = 'shipped' WHERE order_id = $1`,
          [internalOrderId]
        );

        // 5. Prepare and send the shipping confirmation email
        const customerEmail = internalOrder.email;
        const customerName = internalOrder.username;

        const subject = `Your Sherman Peck Productions Order #${internalOrderId} Has Shipped!`;

        // 6. Create the HTML email template
        const html = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Your Order Has Shipped!</h2>
                        <p>Hi ${customerName},</p>
                        <p>Great news! Your order #${internalOrderId} from Sherman Peck Productions has been shipped and is on its way to you.</p>
                        
                        <hr>
                        
                        <h3>Tracking Information</h3>
                        <p>
                            <strong>Carrier:</strong> ${carrier}<br>
                            <strong>Tracking Number:</strong> ${trackingNumber}
                        </p>
                        <p>You can track your package using the link below:</p>
                        <a 
                            href="${trackingUrl}" 
                            style="display: inline-block; padding: 10px 20px; background-color: #c0392b; color: white; text-decoration: none; border-radius: 5px;"
                        >
                            Track Your Package
                        </a>
                        
                        <hr>
                        
                        <p>Thank you for your order!</p>
                        <p><strong>Sherman Peck Productions</strong></p>
                    </div>
                `;

        // 7. Call your sendMail function
        await sendMail({ to: customerEmail, subject, html });
        console.log(
          `Shipping confirmation email sent for Order #${internalOrderId}.`
        );
      } else {
        console.warn(
          `Received 'package_shipped' webhook for an unknown Printful Order ID: ${printfulOrderId}`
        );
      }
    }
    // You can add other 'if (type === ...)' blocks here for other events.
  } catch (err) {
    console.error("Error processing Printful webhook:", err);
    // Return 500 so Printful knows to retry sending the webhook
    return res.status(500).send("Error processing webhook");
  }

  // Acknowledge receipt of the event to Printful
  res.status(200).send("OK");
};
