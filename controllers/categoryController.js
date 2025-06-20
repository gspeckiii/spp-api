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
const Category = require("../models/category")

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll()
    console.log("Fetched categories with prod_count:", categories)
    res.status(200).json(categories)
  } catch (error) {
    console.error("Get categories error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getCategoryById = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Fetching category with ID:", id)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid category ID" })
    }
    const category = await Category.findById(parseInt(id))
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }
    console.log("Fetched category:", category)
    res.status(200).json(category)
  } catch (error) {
    console.error("Get category by ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteCategory = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Deleting category with ID:", id)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid category ID" })
    }
    const category = await Category.delete(parseInt(id))
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }
    res.status(200).json({ message: "Category deleted" })
  } catch (error) {
    console.error("Delete category error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}
