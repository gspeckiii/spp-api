// models/product.js

const pool = require("../config/database");

const Product = {
  findAll: async () => {
    try {
      const result = await pool.query("SELECT * FROM products");
      return result.rows;
    } catch (err) {
      console.error("Find all products error:", err.stack);
      throw err;
    }
  },

  findById: async (id) => {
    try {
      const result = await pool.query("SELECT * FROM products WHERE id = $1", [
        id,
      ]);
      return result.rows[0];
    } catch (err) {
      console.error("Find by ID error:", err.stack);
      throw err;
    }
  },

  create: async (product) => {
    const { cat_fk, prod_name, prod_cost, prod_desc } = product;
    try {
      // Note: The 'historic' column defaults to FALSE in the database, so it doesn't need to be set here.
      const result = await pool.query(
        "INSERT INTO products (cat_fk, prod_name, prod_cost, prod_desc) VALUES ($1, $2, $3, $4) RETURNING *",
        [cat_fk, prod_name, prod_cost, prod_desc]
      );
      return result.rows[0];
    } catch (err) {
      console.error("Create product error:", err.stack);
      throw err;
    }
  },

  update: async (id, product) => {
    // The existing update logic is complex but should handle the 'historic' field if you add it.
    // For now, leaving it as is. You can add 'historic' to this function if you need to update it.
    const { cat_fk, prod_name, prod_cost, prod_desc, historic } = product; // Added historic
    const currentProduct = await Product.findById(id);
    if (!currentProduct) throw new Error("Product not found");

    const updateFields = [];
    const values = [];
    let index = 1;

    if (cat_fk !== undefined && cat_fk !== currentProduct.cat_fk) {
      updateFields.push(`cat_fk = $${index++}`);
      values.push(cat_fk);
    }
    if (prod_name && prod_name !== currentProduct.prod_name) {
      updateFields.push(`prod_name = $${index++}`);
      values.push(prod_name);
    }
    if (prod_cost !== undefined && prod_cost !== currentProduct.prod_cost) {
      updateFields.push(`prod_cost = $${index++}`);
      values.push(prod_cost);
    }
    if (prod_desc !== undefined && prod_desc !== currentProduct.prod_desc) {
      updateFields.push(`prod_desc = $${index++}`);
      values.push(prod_desc);
    }
    // Added logic to update the historic field
    if (historic !== undefined && historic !== currentProduct.historic) {
      updateFields.push(`historic = $${index++}`);
      values.push(historic);
    }
    values.push(id);

    if (updateFields.length === 0) return currentProduct;

    const query = `UPDATE products SET ${updateFields.join(
      ", "
    )} WHERE id = $${index} RETURNING *`;
    try {
      const result = await pool.query(query, values);
      console.log("Update result:", result.rowCount);
      return result.rows[0];
    } catch (err) {
      console.error("Update product error:", err.stack);
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
      );
      if (!result.rows[0]) throw new Error("Product not found");
      return result.rows[0];
    } catch (err) {
      console.error("Delete product error:", err.stack);
      throw err;
    }
  },

  findByCategoryId: async (categoryId) => {
    const qry =
      "SELECT products.id, products.prod_name, products.prod_desc, products.prod_cost, count(image_product.id) AS img_count FROM products LEFT JOIN categories ON products.cat_fk = categories.id LEFT JOIN image_product ON products.id = image_product.product_id WHERE categories.id = $1 AND products.historic = false GROUP BY products.id;";
    try {
      console.log(
        "Executing findByCategoryId query for category ID:",
        categoryId
      );
      const result = await pool.query(qry, [categoryId]);
      console.log("Find by category ID result:", result.rows);
      return result.rows;
    } catch (err) {
      console.error("Find by category ID error:", err.stack);
      throw err;
    }
  },

  // === NEW FUNCTION ADDED HERE ===
  findHistoric: async () => {
    const qry =
      "SELECT products.id, products.prod_name, products.prod_desc, products.prod_cost, count(image_product.id) AS img_count FROM products LEFT JOIN image_product ON products.id = image_product.product_id WHERE products.historic = true GROUP BY products.id;";
    try {
      console.log("Executing findHistoric query.");
      const result = await pool.query(qry);
      console.log("Find historic products result:", result.rows);
      return result.rows;
    } catch (err) {
      console.error("Find historic products error:", err.stack);
      throw err;
    }
  },
};

module.exports = Product;
