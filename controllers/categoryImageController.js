const CategoryImage = require("../models/categoryImageModel")
const path = require("path")
const fs = require("fs")

exports.updateImage = async (req, res) => {
  const { categoryId } = req.params
  try {
    console.log("Received update request for category image ID:", categoryId)

    // Validate categoryId
    if (!categoryId || isNaN(parseInt(categoryId))) {
      console.error("Invalid category ID:", categoryId)
      return res.status(400).json({ error: "Invalid category ID" })
    }

    // Validate file upload
    if (!req.file) {
      console.error("No image file provided in request")
      return res.status(400).json({ error: "No image file provided" })
    }

    // Check for existing image
    const existingImage = await CategoryImage.findByCategoryId(categoryId)
    if (existingImage && existingImage.cat_img_path) {
      const oldFilePath = path.join(__dirname, "..", existingImage.cat_img_path)
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath)
          console.log("Old category image file deleted:", oldFilePath)
        } else {
          console.warn("Old image file not found on disk:", oldFilePath)
        }
      } catch (fileError) {
        console.error("Error deleting old image file:", fileError.message, fileError.stack)
        // Continue with update
      }
    } else {
      console.log("No existing image found for category ID:", categoryId)
    }

    // Update with new image
    const newImgPath = path.join("images/categories", req.file.filename)
    console.log("Updating category with new image path:", newImgPath)
    const updatedImage = await CategoryImage.update(categoryId, { cat_img_path: newImgPath })

    if (!updatedImage) {
      console.error("Failed to update category image in database for ID:", categoryId)
      return res.status(500).json({ error: "Failed to update category image in database" })
    }

    console.log("Category image updated successfully:", updatedImage)
    res.status(200).json({ id: parseInt(categoryId), cat_img_path: updatedImage.cat_img_path })
  } catch (error) {
    console.error("Update category image error:", error.message, error.stack)
    res.status(500).json({ error: `Internal server error: ${error.message}` })
  }
}

module.exports = exports
