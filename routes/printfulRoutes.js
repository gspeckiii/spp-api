// routes/printfulRoutes.js

const express = require("express");
const router = express.Router();
const printfulController = require("../controllers/printfulController");

// Import your authentication middleware
const { authenticateToken, checkAdmin } = require('../middleware/auth');

// === Define the Product Sync Route ===
// This route is for administrators to sync products from Printful to your database.
// We protect it by chaining your middleware. The request must have a valid token,
// and the user associated with that token must be an admin.

router.post(
    '/sync', 
    [authenticateToken, checkAdmin], // Chain of middleware to run first
    printfulController.syncPrintfulProducts // The controller function to run if auth passes
);

// You can add other protected Printful routes here in the future.
// For example, an endpoint to check the status of a specific Printful order:
// router.get('/orders/:id', authenticateToken, printfulController.getOrderStatus);

module.exports = router;