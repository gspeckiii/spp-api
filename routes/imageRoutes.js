// routes/imageRoutes.js (Corrected and Final)

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const imageController = require("../controllers/imageController");
const multer = require("multer");
const path = require("path");

// === THE DEFINITIVE FIX: Use an environment variable for the destination ===

// If UPLOAD_PATH is set in .env, use it. Otherwise, default to the local path for development.
const uploadDestination = process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, "products")
  : "./images/products/";

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Images only!"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/images/product/:productId",

  upload.array("image", 5),
  authenticateToken,
  imageController.createImage
);

// --- All other routes remain the same ---
router.get("/images/product/:productId", imageController.getImagesByProductId);
router.get("/products/:productId/images", imageController.getImagesByProductId);
router.get("/images/:id", imageController.getImageById);
router.delete("/images/:id", authenticateToken, imageController.deleteImage);
router.put("/images/:id", authenticateToken, imageController.updateImage);

module.exports = router;
