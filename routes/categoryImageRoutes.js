// routes/categoryImageRoutes.js (Corrected)

const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const categoryImageController = require("../controllers/categoryImageController");
const multer = require("multer");
const path = require("path");

const uploadDestination = process.env.UPLOAD_PATH
  ? path.join(process.env.UPLOAD_PATH, "categories")
  : "./images/categories/";

const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: (req, file, cb) => {
    // The filename logic here is actually fine, the problem is in the controller.
    cb(null, `cat-${Date.now()}-${file.originalname}`);
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

// === THE FIX: Add the multer middleware back into the chain ===
router.put(
  "/images/category/:categoryId",
  authenticateToken,
  upload.single("image"), // This middleware is ESSENTIAL for saving the file
  categoryImageController.updateImage
);

module.exports = router;
