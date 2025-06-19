const Image = require("../models/image")
const path = require("path")

exports.createImage = async (req, res) => {
  const { productId } = req.params
  try {
    console.log("Creating image for product ID:", productId)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" })
    }

    const images = []
    for (const file of req.files) {
      const imgPath = path.join("images", file.filename)
      const imgName = file.originalname
      const image = await Image.create(productId, { img_path: imgPath, img_name: imgName, img_desc: "" })
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
