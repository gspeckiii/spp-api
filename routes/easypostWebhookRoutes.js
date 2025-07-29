// routes/easypostWebhookRoutes.js
const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// This route corresponds to POST https://.../api/easypost-webhook
router.post("/", webhookController.handleTrackingWebhook);

module.exports = router;
