const pool = require("../config/database")
const qString = `
  SELECT DISTINCT 
    categories.id AS cat_id, 
    categories.cat_name, 
    categories.cat_desc, 
    categories.cat_vid, 
    categories.cat_img_path, 
  
    COUNT(products.id) AS prod_count 
  FROM categories 
  LEFT JOIN products ON categories.id = products.cat_fk 
  GROUP BY categories.id, categories.cat_name, categories.cat_desc, categories.cat_vid, categories.cat_img_path
`

const Category = {
  findAll: async () => {
    try {
      const result = await pool.query(qString)
      console.log("Find all categories result:", result.rows)
      return result.rows
    } catch (err) {
      console.error("Find all categories error:", err.stack)
      throw err
    }
  },

  findById: async id => {
    try {
      const result = await pool.query(
        `
        SELECT 
          id AS cat_id, 
          cat_name, 
          cat_desc, 
          cat_vid, 
          cat_img_path,
          (SELECT COUNT(*) FROM products WHERE cat_fk = $1) AS prod_count 
        FROM categories 
        WHERE id = $1
        `,
        [id]
      )
      console.log("Find by ID result:", result.rows[0])
      return result.rows[0]
    } catch (err) {
      console.error("Find by ID error:", err.stack)
      throw err
    }
  },

  create: async category => {
    const { cat_name, cat_desc, cat_vid } = category
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
          cat_img_path
          0 AS prod_count
        `,
        [cat_name, cat_desc, cat_vid || null]
      )
      console.log("Create category result:", result.rows[0])
      return result.rows[0]
    } catch (err) {
      console.error("Create category error:", err.stack)
      throw err
    }
  },

  update: async (id, category) => {
    const { cat_name, cat_desc, cat_vid } = category
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
          cat_img_path
          (SELECT COUNT(*) FROM products WHERE cat_fk = $4) AS prod_count
        `,
        [cat_name, cat_desc, cat_vid || null, id]
      )
      console.log("Update category result:", result.rows[0])
      return result.rows[0]
    } catch (err) {
      console.error("Update category error:", err.stack)
      throw err
    }
  },

  delete: async id => {
    try {
      const result = await pool.query(
        `
        DELETE FROM categories 
        WHERE id = $1 
        RETURNING 
          id AS cat_id, 
          cat_name, 
          cat_desc, 
          cat_vid, 
          cat_img_path
        `,
        [id]
      )
      console.log("Delete category result:", result.rows[0])
      return result.rows[0]
    } catch (err) {
      console.error("Delete category error:", err.stack)
      throw err
    }
  }
}

module.exports = Category
