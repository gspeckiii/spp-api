const Image = require("../models/image")
const path = require("path")
const fs = require("fs")

exports.createImage = async (req, res) => {
  const { productId } = req.params
  try {
    console.log("Received request with files:", req.files)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" })
    }

    const images = []
    for (const file of req.files) {
      const imgPath = path.join("images", file.filename)
      const imgName = file.originalname
      const image = await Image.create(productId, { img_path: imgPath, img_name: imgName, img_desc: "", img_order: 0, img_media: 0 })
      images.push(image)
    }

    console.log("Images created successfully:", images)
    res.status(201).json(images)
  } catch (error) {
    console.error("Create image error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}

exports.getImagesByProductId = async (req, res) => {
  const { productId } = req.params
  try {
    console.log("Fetching images for product ID:", productId)
    const images = await Image.findByProductId(productId)
    console.log("Fetched images:", images)
    res.status(200).json(images)
  } catch (error) {
    console.error("Get images by product ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getImageById = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Fetching image by ID:", id)
    const image = await Image.findById(id)
    if (!image) {
      return res.status(404).json({ error: "Image not found" })
    }
    console.log("Fetched image:", image)
    res.status(200).json(image)
  } catch (error) {
    console.error("Get image by ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteImage = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Deleting image with ID:", id)
    const image = await Image.findById(id)
    if (!image) {
      return res.status(404).json({ error: "Image not found" })
    }

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, "..", image.img_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log("Image file deleted:", filePath)
    }

    await Image.delete(id)
    console.log("Image deleted successfully")
    res.status(200).json({ message: "Image deleted" })
  } catch (error) {
    console.error("Delete image error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateImage = async (req, res) => {
  const { id } = req.params
  const { img_desc, img_order, img_media } = req.body
  console.log("Received update request for image ID:", id, "with data:", req.body)
  try {
    const image = await Image.findById(id)
    if (!image) {
      return res.status(404).json({ error: "Image not found" })
    }

    await Image.update(id, { img_desc, img_order, img_media })
    console.log("Image updated successfully")
    res.status(200).json({ message: "Image updated" })
  } catch (error) {
    console.error("Update image error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}
