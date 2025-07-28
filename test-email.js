// test-email.js
const { sendMail } = require("./middleware/emailService");
// test-email.js

// Add this line right at the top, after the require statement
require("dotenv").config();

// **** ADD THIS DEBUG LINE ****
console.log("DEBUG: Using User ->", process.env.BREVO_SMTP_USER);
console.log("Sending test email...");

sendMail({
  to: "g.peck.iii@gmail.com", // Send it to yourself to test
  subject: "Hello from my Node.js App!",
  html: "<h1>Success!</h1><p>If you are reading this, your Brevo integration is working!</p>",
})
  .then(() => {
    console.log("Test email script finished.");
  })
  .catch((err) => {
    console.error("Test email script failed:", err);
  });
