// === CORRECTED FILE ===
const pool = require("../config/database");

const Category = {
  findAll: async () => {
    try {
      // === THIS IS THE CORRECTED QUERY ===
      // It now counts ONLY products that are NOT historic and NOT from Printful.
      const query = `
        SELECT 
          c.id AS cat_id, 
          c.cat_name, 
          c.cat_desc, 
          c.cat_vid, 
          c.cat_img_path, 
          COUNT(p.id) AS prod_count 
        FROM 
          categories c
        LEFT JOIN 
          products p ON c.id = p.cat_fk 
          AND p.historic = FALSE 
          AND p.is_printful_product = FALSE
        GROUP BY 
          c.id
        ORDER BY
          c.cat_name;
      `;

      const result = await pool.query(query);
      console.log("Find all categories result:", result.rows);
      return result.rows;
    } catch (err) {
      console.error("Find all categories error:", err.stack);
      throw err;
    }
  },

  findById: async (id) => {
    try {
      // Corrected this query as well to only count relevant products.
      const result = await pool.query(
        `
        SELECT 
          id AS cat_id, 
          cat_name, 
          cat_desc, 
          cat_vid, 
          cat_img_path,
          (SELECT COUNT(*) FROM products WHERE cat_fk = $1 AND historic = FALSE AND is_printful_product = FALSE) AS prod_count 
        FROM categories 
        WHERE id = $1
        `,
        [id]
      );
      console.log("Find by ID result:", result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error("Find by ID error:", err.stack);
      throw err;
    }
  },

  create: async (category) => {
    const { cat_name, cat_desc, cat_vid } = category;
    try {
      const result = await pool.query(
        `
        INSERT INTO categories (cat_name, cat_desc, cat_vid) 
        VALUES ($1, $2, $3) 
        RETURNING 
          id AS cat_id, 
          cat_name, 
          cat_desc, 
          cat_vid, 
          cat_img_path,
          0 AS prod_count
        `,
        [cat_name, cat_desc, cat_vid || null]
      );
      console.log("Create category result:", result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error("Create category error:", err.stack);
      throw err;
    }
  },

  update: async (id, category) => {
    // ... (This function looks okay, but could be improved for consistency)
    const { cat_name, cat_desc, cat_vid } = category;
    try {
      const result = await pool.query(
        `
        UPDATE categories 
        SET 
          cat_name = $1, 
          cat_desc = $2, 
          cat_vid = $3 
        WHERE id = $4 
        RETURNING 
          id AS cat_id, 
          cat_name, 
          cat_desc, 
          cat_vid, 
          cat_img_path,
          (SELECT COUNT(*) FROM products WHERE cat_fk = $4 AND historic = FALSE AND is_printful_product = FALSE) AS prod_count
        `,
        [cat_name, cat_desc, cat_vid || null, id]
      );
      console.log("Update category result:", result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error("Update category error:", err.stack);
      throw err;
    }
  },

  delete: async (id) => {
    // ... (This function is okay)
    try {
      const result = await pool.query(
        `DELETE FROM categories WHERE id = $1 RETURNING *`,
        [id]
      );
      console.log("Delete category result:", result.rows[0]);
      return result.rows[0];
    } catch (err) {
      console.error("Delete category error:", err.stack);
      throw err;
    }
  },
};

module.exports = Category;
