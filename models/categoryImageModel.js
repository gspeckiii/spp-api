const pool = require("../config/database")

const CategoryImage = {
  create: async (categoryId, image) => {
    const { cat_img_path } = image
    try {
      const result = await pool.query(
        `
        INSERT INTO categories (id, cat_img_path) 
        VALUES ($1, $2) 
        ON CONFLICT (id) 
        DO UPDATE SET cat_img_path = EXCLUDED.cat_img_path 
        RETURNING id, cat_img_path
        `,
        [categoryId, cat_img_path]
      )
      return result.rows[0]
    } catch (err) {
      console.error("Create category image error:", err.message, err.stack)
      throw err
    }
  },

  findByCategoryId: async categoryId => {
    try {
      const result = await pool.query(
        `
        SELECT id, cat_img_path 
        FROM categories 
        WHERE id = $1 AND cat_img_path IS NOT NULL
        `,
        [categoryId]
      )
      return result.rows[0]
    } catch (err) {
      console.error("Find category image by ID error:", err.message, err.stack)
      throw err
    }
  },

  delete: async categoryId => {
    try {
      await pool.query(
        `
        UPDATE categories 
        SET cat_img_path = NULL 
        WHERE id = $1
        `,
        [categoryId]
      )
    } catch (err) {
      console.error("Delete category image error:", err.message, err.stack)
      throw err
    }
  },

  update: async (categoryId, updates) => {
    const { cat_img_path } = updates
    try {
      const result = await pool.query(
        `
        UPDATE categories 
        SET cat_img_path = $1 
        WHERE id = $2 
        RETURNING id, cat_img_path
        `,
        [cat_img_path, categoryId]
      )
      return result.rows[0]
    } catch (err) {
      console.error("Update category image error:", err.message, err.stack)
      throw err
    }
  }
}

module.exports = CategoryImage
