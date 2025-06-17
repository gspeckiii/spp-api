const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const imageController = require("../controllers/imageController")

router.post("/images", authenticateToken, imageController.createImage)
router.get("/images", imageController.getAllImages)
router.get("/images/:id", imageController.getImageById)
router.put("/images/:id", authenticateToken, imageController.updateImage)
router.delete("/images/:id", authenticateToken, imageController.deleteImage)

router.post("/category-image", authenticateToken, imageController.linkCategoryImage)
router.get("/category-images", imageController.getCategoryImages)

router.post("/product-image", authenticateToken, imageController.linkProductImage)
router.get("/product-images", imageController.getProductImages)

module.exports = router
