// === NEW TEMPORARY FILE ===
const express = require("express");
const router = express.Router();
const TestController = require("../controllers/TestController");

router.get("/printful-direct", TestController.runDirectPrintfulTest);

module.exports = router;
