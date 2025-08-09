// controllers/productController.js
// === CHANGED FILE ===
const Product = require("../models/product");
const pool = require("../config/database"); // <-- Make sure pool is imported

// ... (all your existing controller functions like createProduct, getAllProducts, etc.)

// === ADD THIS NEW CONTROLLER FUNCTION ===
exports.getPrintfulProducts = async (req, res) => {
  try {
    // Add the 'printful_thumbnail_url' to the SELECT statement
    const { rows } = await pool.query(
      `
            SELECT 
                id, prod_name, prod_cost, prod_desc, printful_thumbnail_url
            FROM products
            WHERE is_printful_product = TRUE ORDER BY prod_name
            `
    );
    res.json(rows);
  } catch (error) {
    console.error("Get Printful products error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ... (rest of the file is unchanged)
exports.createProduct = async (req, res) => {
  const { cat_fk, prod_name, prod_cost, prod_desc } = req.body;
  try {
    const product = await Product.create({
      cat_fk,
      prod_name,
      prod_cost,
      prod_desc,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error.stack);
    res.status(400).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error("Get all products error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  // Now includes 'historic' in the destructured body
  const { cat_fk, prod_name, prod_cost, prod_desc, historic } = req.body;
  try {
    console.log("Attempting to update product with ID:", id, "data:", req.body);
    const product = await Product.update(id, {
      cat_fk,
      prod_name,
      prod_cost,
      prod_desc,
      historic, // pass historic to the update function
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    console.log("Product updated successfully:", product);
    res.json(product);
  } catch (error) {
    console.error("Update product error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === MODIFIED FUNCTION ===
// Reads the 'filter' query parameter from the request
exports.getProductsByCategoryId = async (req, res) => {
  const { id } = req.params;
  const { filter } = req.query; // e.g., ?filter=historic

  try {
    console.log(
      `Fetching products for category ID: ${id} with filter: ${filter}`
    );
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    // Pass the filter to the model function
    const products = await Product.findByCategoryId(parseInt(id), filter);
    console.log("Fetched products:", products);
    res.status(200).json(products);
  } catch (error) {
    console.error("Get products by category ID error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ... (getHistoricProducts, deleteProduct are unchanged)

exports.getHistoricProducts = async (req, res) => {
  try {
    console.log("Fetching historic products");
    const products = await Product.findHistoric();
    res.status(200).json(products);
  } catch (error) {
    console.error("Get historic products error:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("Deleting product with ID:", id);
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    await Product.delete(parseInt(id));
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error.stack);
    res.status(400).json({ error: error.message });
  }
};
