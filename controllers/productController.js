const Product = require("../models/product")

exports.createProduct = async (req, res) => {
  const { cat_fk, prod_name, prod_cost, prod_desc } = req.body
  try {
    const product = await Product.create({ cat_fk, prod_name, prod_cost, prod_desc })
    res.status(201).json(product)
  } catch (error) {
    console.error("Create product error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll()
    res.json(products)
  } catch (error) {
    console.error("Get all products error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getProductById = async (req, res) => {
  const { id } = req.params
  try {
    const product = await Product.findById(id)
    if (!product) return res.status(404).json({ error: "Product not found" })
    res.json(product)
  } catch (error) {
    console.error("Get product by ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.updateProduct = async (req, res) => {
  const { id } = req.params
  const { cat_fk, prod_name, prod_cost, prod_desc } = req.body
  try {
    console.log("Attempting to update product with ID:", id, "data:", req.body) // Debug
    const product = await Product.update(id, { cat_fk, prod_name, prod_cost, prod_desc })
    if (!product) return res.status(404).json({ error: "Product not found" })
    console.log("Product updated successfully:", product) // Debug
    res.json(product)
  } catch (error) {
    console.error("Update product error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.getProductsByCategoryId = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Fetching products for category ID:", id)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid category ID" })
    }
    const products = await Product.findByCategoryId(parseInt(id))
    console.log("Fetched products:", products)
    res.status(200).json(products)
  } catch (error) {
    console.error("Get products by category ID error:", error.stack)
    res.status(500).json({ error: "Internal server error" })
  }
}

exports.deleteProduct = async (req, res) => {
  const { id } = req.params
  try {
    console.log("Deleting product with ID:", id)
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid product ID" })
    }
    const product = await Product.delete(parseInt(id))
    res.status(200).json({ message: "Product deleted" })
  } catch (error) {
    console.error("Delete product error:", error.stack)
    res.status(400).json({ error: error.message })
  }
}
