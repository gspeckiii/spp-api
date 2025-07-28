// services/emailService.js

// This line loads the variables from your .env file
require("dotenv").config();

const nodemailer = require("nodemailer");

// Create a transporter object using Brevo's SMTP details
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

/**
 * Sends an email using Brevo.
 * @param {object} mailOptions - The mail options.
 * @param {string} mailOptions.to - The recipient's email address.
 * @param {string} mailOptions.subject - The email subject.
 * @param {string} mailOptions.html - The HTML body of the email.
 * @returns {Promise<void>}
 */
async function sendMail({ to, subject, html }) {
  try {
    // Use your verified domain in the 'from' address!
    const info = await transporter.sendMail({
      from: '"Sherman Peck Productions" <noreply@shermanpeckproductions.com>',
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Message sent successfully via Brevo: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    throw new Error("Could not send the email.");
  }
}

module.exports = { sendMail };
