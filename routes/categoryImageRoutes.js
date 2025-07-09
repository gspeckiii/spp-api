const express = require("express")
const router = express.Router()
const { authenticateToken } = require("../middleware/auth")
const categoryImageController = require("../controllers/categoryImageController")
const multer = require("multer")
const path = require("path")

// Log to verify controller import
  console.log("categoryImageController exports:", Object.keys(categoryImageController))

const storage = multer.diskStorage({
  destination: "./images/categories/",
  filename: (req, file, cb) => {
    console.log("Received category image file:", file.originalname)
    cb(null, `cat-${Date.now()}-${file.originalname}`)
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

const upload = multer({ storage, fileFilter, limits: { fileSize: 5000000 } }).single("image")

router.put(
  "/images/category/:categoryId",
  authenticateToken,
  (req, res, next) => {
    console.log("Category image middleware triggered for PUT")
    upload(req, res, err => {
      if (err) {
        console.error("Multer error:", err.message)
        return res.status(400).json({ error: err.message })
      }
      next()
    })
  },
  categoryImageController.updateImage
)

module.exports = router
