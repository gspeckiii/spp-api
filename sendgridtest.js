const sgMail = require("@sendgrid/mail")
require("dotenv").config()
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
sgMail
  .send({
    to: "gspeckiii@proton.me",
    from: "gspeckiii@proton.me", // Use the same verified email
    subject: "Test Email",
    text: "This is a test email from SendGrid."
  })
  .then(() => console.log("Email sent successfully"))
  .catch(error => console.error("SendGrid error:", error))
