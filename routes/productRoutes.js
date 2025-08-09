// routes/productRoutes.js

const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

router.post("/products", productController.createProduct);
router.get("/products", productController.getAllProducts);

router.get("/products/printful", productController.getPrintfulProducts);
// === NEW ROUTE ADDED HERE ===
// This specific route must come BEFORE the general '/products/:id' route
router.get("/products/historic", productController.getHistoricProducts);

router.get("/products/category/:id", productController.getProductsByCategoryId);
router.get("/products/:id", productController.getProductById);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router;
