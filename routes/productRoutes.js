const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const productController = require("../controllers/productController")

router.post("/products", authenticateToken, productController.createProduct)
router.get("/products", authenticateToken, productController.getAllProducts)
router.get("/products/:id", authenticateToken, productController.getProductById)
router.put("/products/:id", authenticateToken, productController.updateProduct)
router.delete("/products/:id", authenticateToken, productController.deleteProduct)
router.get("/products/category/:id", authenticateToken, productController.getProductsByCategoryId) // Custom route

module.exports = router
