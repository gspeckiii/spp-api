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

exports.createCategory = async (req, res) => {
  const { cat_name, cat_desc, cat_vid } = req.body
  try {
    console.log("Creating category with body:", req.body)
    if (!cat_name || !cat_desc) {
      return res.status(400).json({ error: "Category name and description are required" })
    }
    const category = await Category.create({ cat_name, cat_desc, cat_vid })
    console.log("Created category:", category)
    res.status(201).json(category)
  } catch (error) {
    console.error("Create category error:", error.stack)
    res.status(500).json({ error: error.message || "Internal server error" })
  }
}

exports.updateCategory = async (req, res) => {
  const { id } = req.params
  const { cat_name, cat_desc, cat_vid } = req.body
  try {
    console.log("Updating category with ID:", id, req.body)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid category ID" })
    }
    const category = await Category.update(parseInt(id), { cat_name, cat_desc, cat_vid })
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }
    console.log("Updated category:", category)
    res.status(200).json(category)
  } catch (error) {
    console.error("Update category error:", error.stack)
    res.status(400).json({ error: error.message })
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
