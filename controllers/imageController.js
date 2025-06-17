const imageModel = require("../models/image")

exports.createImage = async (req, res) => {
  const { img_name, img_display } = req.body
  try {
    const image = await imageModel.create({ img_name, img_display })
    res.status(201).json(image)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllImages = async (req, res) => {
  try {
    const images = await imageModel.findAll()
    res.json(images)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getImageById = async (req, res) => {
  const { id } = req.params
  try {
    const image = await imageModel.findById(id)
    if (!image) return res.status(404).json({ error: "Image not found" })
    res.json(image)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateImage = async (req, res) => {
  const { id } = req.params
  const { img_name, img_display } = req.body
  try {
    const image = await imageModel.update(id, { img_name, img_display })
    if (!image) return res.status(404).json({ error: "Image not found" })
    res.json(image)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteImage = async (req, res) => {
  const { id } = req.params
  try {
    const image = await imageModel.delete(id)
    if (!image) return res.status(404).json({ error: "Image not found" })
    res.json({ message: "Image deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.linkCategoryImage = async (req, res) => {
  const { cat_fk, img_fk } = req.body
  try {
    const link = await imageModel.linkCategoryImage(cat_fk, img_fk)
    res.status(201).json(link)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getCategoryImages = async (req, res) => {
  try {
    const links = await imageModel.getCategoryImages()
    res.json(links)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.linkProductImage = async (req, res) => {
  const { prod_fk, img_fk } = req.body
  try {
    const link = await imageModel.linkProductImage(prod_fk, img_fk)
    res.status(201).json(link)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getProductImages = async (req, res) => {
  try {
    const links = await imageModel.getProductImages()
    res.json(links)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
