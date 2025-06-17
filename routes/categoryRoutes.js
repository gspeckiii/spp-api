const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const categoryController = require("../controllers/categoryController")

router.post("/categories", authenticateToken, categoryController.createCategory)
router.get("/categories", categoryController.getAllCategories)
router.get("/categories/:id", categoryController.getCategoryById)
router.put("/categories/:id", authenticateToken, categoryController.updateCategory)
router.delete("/categories/:id", authenticateToken, categoryController.deleteCategory)

module.exports = router
