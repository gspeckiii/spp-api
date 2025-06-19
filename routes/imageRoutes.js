const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const imageController = require("../controllers/imageController")
const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
  destination: "./images/",
  filename: (req, file, cb) => {
    console.log("Received file:", file.originalname)
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)
  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error("Error: Images only!"))
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 1000000 } }).array("image", 5)

router.post(
  "/images/product/:productId",
  authenticateToken,
  (req, res, next) => {
    console.log("Middleware triggered, files:", req.files)
    upload(req, res, err => {
      if (err) {
        console.error("Multer error:", err.message)
        return res.status(400).json({ error: err.message })
      }
      next()
    })
  },
  imageController.createImage
)

router.get("/images/product/:productId", authenticateToken, imageController.getImagesByProductId)

router.get("/images/:id", authenticateToken, imageController.getImageById) // New endpoint
// Add this line after router.get("/images/product/:productId", ...)
router.delete("/images/:id", authenticateToken, imageController.deleteImage)

router.put("/images/:id", authenticateToken, imageController.updateImage)

module.exports = router
