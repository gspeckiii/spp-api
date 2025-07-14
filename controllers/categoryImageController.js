// controllers/categoryImageController.js (Corrected)

const CategoryImage = require("../models/categoryImageModel");
const path = require("path");
const fs = require("fs");

exports.updateImage = async (req, res) => {
  const { categoryId } = req.params;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Check for and delete the old image file first
    const existingImage = await CategoryImage.findByCategoryId(categoryId);
    if (existingImage && existingImage.cat_img_path) {
      const basePath = process.env.UPLOAD_PATH
        ? process.env.UPLOAD_PATH
        : path.join(__dirname, "..", "images");
      const relativePath = existingImage.cat_img_path.replace(/^images\//, "");
      const oldFilePath = path.join(basePath, relativePath);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // === THE FIX: Construct the DB path from the multer-generated filename ===
    // req.file.filename already includes the "cat-" prefix from the multer config
    const newImgPath = path
      .join("images/categories", req.file.filename)
      .replace(/\\/g, "/");

    const updatedCategory = await CategoryImage.update(categoryId, {
      cat_img_path: newImgPath,
    });

    if (!updatedCategory) {
      return res
        .status(500)
        .json({ error: "Failed to update category image in database" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Update category image error:", error.message, error.stack);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

module.exports = exports;
