const categoryModel = require("../models/category")

exports.createCategory = async (req, res) => {
  const { cat_name, cat_desc, cat_vid } = req.body
  try {
    const category = await categoryModel.create({ cat_name, cat_desc, cat_vid, prod_count, img_count })
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAll()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getCategoryById = async (req, res) => {
  const { id } = req.params
  try {
    const category = await categoryModel.findById(id)
    if (!category) return res.status(404).json({ error: "Category not found" })
    res.json(category)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateCategory = async (req, res) => {
  const { id } = req.params
  const { cat_name, cat_desc, cat_vid } = req.body
  console.log(`Updating category ${id} with:`, { cat_name, cat_desc, cat_vid }) // Debug
  try {
    const category = await categoryModel.update(id, { cat_name, cat_desc, cat_vid })
    if (!category) return res.status(404).json({ error: "Category not found" })
    res.json(category)
  } catch (error) {
    console.error("Update category error:", error.stack) // Ensure logging
    res.status(500).json({ error: error.message })
  }
}

exports.deleteCategory = async (req, res) => {
  const { id } = req.params
  try {
    const category = await categoryModel.delete(id)
    if (!category) return res.status(404).json({ error: "Category not found" })
    res.json({ message: "Category deleted" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
